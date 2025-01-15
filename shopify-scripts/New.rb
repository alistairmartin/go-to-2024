#<Yotpo 1>
######
## This script enables line items price adjustments for Yotpo's loyalty products.
## In order to use script, you have to first install Shopify's Script Editor app.
##
## Embed this script in a blank template in Script Editor, and make sure to fill in 'reverse_api_key' in line 15.
##
## Last updated: September 10th, 2020
######

swell_discount_amount_cents = nil
swell_discount_used = false

def calculate_token(point_redemption_id, variant_id)
 # Fill in your loyalty api key in reverse in the line below
 reverse_api_key = "ttwDJHFyGcbpi7FVlV1gfLvZ"
 buckets = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
 raw_token = variant_id.to_s.reverse + reverse_api_key + point_redemption_id.to_s.reverse
 token = ""
 rotate_amount = 1 + (point_redemption_id.to_i % 59)
 
 raw_token.each_char do |char|
  ord = char.ord
  
  # "A" to "Z"
  if ord >= 65 and ord <= 90
   orig_index = ord-65
  elsif ord >= 97 and ord <= 122
   orig_index = ord - 97 + 26
  elsif ord >= 48 and ord <= 57
   orig_index = ord - 48 + 52
  else
   orig_index = false
  end
  
  if orig_index
   new_index = (orig_index + rotate_amount) % 62
   token += buckets[new_index]
  end
 end
 
 return token
end
#</Yotpo 1>

# SURFACE GLOBAL VARIABLES
cart = Input.cart
customer = cart.customer

# Seasonal promotion - Boxing Day buy 3 items get the cheapest for free
# Items must not include promotion, samples, gifts, and sets
$promo_message = 'Three for Two!'
$promo_enabled = false
$cheapest_item_price
$cheapest_item
$cart_items_minimum = 3
$cart_items_count = 0

if $promo_enabled
  cart.line_items.each do |item|
    if !item.properties.key?('_promo') &&
       !item.properties.key?('_sample') &&
       !item.properties.key?('_checkout_code') &&
       !item.variant.product.tags.index('set') &&
       !item.variant.product.tags.index('hidden') &&
       !item.variant.product.gift_card? &&
       item.variant.price > Money.new(cents: 0)
      
      if !$cheapest_item_price
        $cheapest_item_price = item.variant.price
        $cheapest_item = item.variant.id
      else
        if item.variant.price < $cheapest_item_price
          $cheapest_item_price = item.variant.price
          $cheapest_item = item.variant.id
        end
      end
      
      $cart_items_count = $cart_items_count + 1
    end
  end
  
  if $cart_items_count >= $cart_items_minimum
    cart.line_items.each do |item|
      if item.variant.id == $cheapest_item
        if item.quantity > 1
          new_line_item = item.split(take: 1)
          new_line_item.change_line_price(Money.new(cents: 0), message: $promo_message)
          cart.line_items << new_line_item
        else
          item.change_line_price(Money.new(cents: 0), message: $promo_message)
        end
      end
    end
  end
end

# Calculate a cart total that excludes gift items that will be discounted
$total_spend = cart.subtotal_price
$is_just_gift_cards = true

$eligible_brands = []
$eligible_types = []
$eligible_collections = []

$eligible_products = []
$promo_products = []
$checkout_gifts = []

cart.line_items.each do |item|
  variant_id = item.variant.id

  if !item.properties.key?('_promo') && !item.properties.key?('_sample') && !item.properties.key?('_checkout_code') && item.variant.price > Money.new(cents: 0)
    $eligible_products << item

    # Capture attributes of eligible items
    $eligible_types << item.variant.product.product_type
    if item.properties.key?('_brand') 
      $eligible_brands << item.properties['_brand']
    end
    if item.properties.key?('_collections') && item.properties['_collections'].is_a?(Array)
      # TO DO: Check that this is a valid array
      $eligible_collections.concat(item.properties['_collections'])
    end

  else 
    if item.properties.key?('_promo')
      $promo_products << item
    end

    if item.properties.key?('_checkout_code')
      $checkout_gifts << item
    end

    $total_spend = $total_spend - item.variant.price
  end
  if item.variant.product.gift_card? != true
    $is_just_gift_cards = false
  end

  #<Yotpo 2>
  # handle fixed amount discounts
  # we store the discount amount on the first non-free item in the cart
  # and then later we distribute the discount evenly across all remaining line items
  if item.properties["_swell_discount_type"] && item.properties["_swell_discount_type"].eql?("cart_fixed_amount")
   if calculate_token(item.properties["_swell_redemption_id"], variant_id) == item.properties["_swell_redemption_token"]
     swell_discount_amount_cents = item.properties["_swell_discount_amount_cents"].to_i
     swell_discount_used = true
   end
  end
  #</Yotpo 2>

end

# If the cart is all gift cards, set spend to 0.
if $is_just_gift_cards == true
  $total_spend = Money.new(cents: 0)
end

puts $eligible_brands
puts $eligible_types
puts $eligible_collections

# SET UP PROMO CLASSES AND METHODS
class FreeGift
  attr_accessor :product, :q_all, :q_min_spend, :q_product, :q_collection, :q_brand, :q_type, :q_params, :message
  def initialize(product, q_all, q_min_spend, q_product, q_collection, q_brand, q_type, q_params, message)
    @product = product
    @q_all = q_all
    @q_min_spend = q_min_spend
    @q_product = q_product
    @q_collection = q_collection
    @q_brand = q_brand
    @q_type = q_type
    @q_params = q_params
    @message = message
  end
end

def checkGiftEligibility(gift, giftItem)
  if gift.q_all === true
    return true
  end

  unless gift.q_min_spend.empty?
    q_min_spend = Money.new(cents: gift.q_min_spend.to_f * 100)

    if $total_spend < q_min_spend
      return false
    end
  end

  unless gift.q_product.empty?
    q_product = gift.q_product.to_f
    unless $eligible_products.any? { |item| item.variant.product.id === q_product }
      return false
    end
  end

  unless gift.q_collection.empty?
    unless $eligible_collections.include? gift.q_collection
      return false
    end
  end

  unless gift.q_brand.empty?
    unless $eligible_brands.include? gift.q_brand
      return false
    end
  end

  unless gift.q_type.empty?
    unless $eligible_types.include? gift.q_type
      return false
    end
  end

  unless gift.q_params.empty?
    q_params = gift.q_params.split(',')
    unless (giftItem.properties.key?('_matching_param') && q_params.include?(giftItem.properties['_matching_param']))
      return false
    end
  end

  return true
end

class SampleTier
  attr_accessor :type, :min_spend, :pool_1, :qty_1, :pool_2, :qty_2, :message
  def initialize(type, min_spend, pool_1, qty_1, pool_2, qty_2, message)
    @type = type
    @min_spend = min_spend
    @pool_1 = pool_1
    @qty_1 = qty_1
    @pool_2 = pool_2
    @qty_2 = qty_2
    @message = message
  end
end

# Define tier join gifts for loyalty tiers
class LoyaltyTier
  attr_accessor :handle, :tier_join_gift
  def initialize(handle, tier_join_gift)
    @handle = handle
    @tier_join_gift = tier_join_gift
  end
end

def checkLoyalty(customer, loyalty_tiers)
  if !customer
    return false
  end

  loyalty_tier = loyalty_tiers.find { |tier| customer.tags.include? "swell_vip_#{tier.handle}" }
  puts loyalty_tier
  
  return loyalty_tier
end

def checkLoyaltyTierGiftRedeemed(customer, tier)
  gift_redeemed_tag = "#{tier.handle}_tier_gift_redeemed"
  if customer.tags.include? gift_redeemed_tag
    return true
  end

  return false
end

# POPULATE PROMOTIONS
gifts = []
sample_tiers = []
checkout_gift_code_prefixes = []
loyalty_tiers = []

# Insert theme output Script setup config here. See docs for details.
# gifts
gifts << FreeGift.new(6873190727814, false, "", "", "reusable-roundies-gift-collection", "", "", "", "Reusable Roundies")
# sample_tiers
sample_tiers << SampleTier.new("pick_tier", "0", "tier-1-2-samples", "1", "undefined", "undefined", "Enjoy your free sample!")
# checkout_gift_code_prefixes
checkout_gift_code_prefixes << 'friendgift'
checkout_gift_code_prefixes << 'bestiegift'
checkout_gift_code_prefixes << 'bffgift'
checkout_gift_code_prefixes << 'freetmzg'
checkout_gift_code_prefixes << 'fancy'
checkout_gift_code_prefixes << 'transf'
checkout_gift_code_prefixes << 'RFMMASK09'
checkout_gift_code_prefixes << 'GIFTME'
checkout_gift_code_prefixes << 'FREEMASK'

# loyalty_tiers
loyalty_tiers << LoyaltyTier.new("mate", false)
loyalty_tiers << LoyaltyTier.new("friend", 31341291569286)
loyalty_tiers << LoyaltyTier.new("bestie", 34899452756102)
loyalty_tiers << LoyaltyTier.new("bff", 39374862680198)
loyalty_tiers << LoyaltyTier.new("peach friends", false)

# DISCOUNT GIFTS
$promo_products.each do |giftItem|
  # For each, see if their _promo attribute matches a gift
  gift = gifts.find { |each| each.message == giftItem.properties['_promo'] }

  # Check that it's the right product and that other criteria are met
  if gift && giftItem.variant.product.id === gift.product && checkGiftEligibility(gift, giftItem)

    # Apply discount
    discount_total = giftItem.variant.price
    giftItem.change_line_price((giftItem.line_price - discount_total), message: gift.message)
  end
end

# ASSESS WHICH SAMPLE TIER TO APPLY
# Reverse tiers so that the highest eligible reward is used first
sample_tiers = sample_tiers.sort_by { |tier| tier.min_spend.to_f }.reverse

$eligible_tier = false
$pool_1_allowable_qty = false
$pool_2_allowable_qty = false

sample_tiers.each do |tier|
  min_spend = Money.new(cents: tier.min_spend.to_f * 100)
  next if $total_spend < min_spend
  $eligible_tier = tier
  break
end

# ASSESS WHICH SAMPLES TO DISCOUNT
if $eligible_tier
  # Select valid samples
  samples = cart.line_items.select { |item| item.properties.key?('_sample') && item.properties.key?('_collections') }
  samples_to_discount = []

  $allowable_qty = $eligible_tier.qty_1.to_i
  samples_to_discount.concat samples.select { |sample| sample.properties['_collections'].include? $eligible_tier.pool_1 }.take($allowable_qty)

  case $eligible_tier.type
    when 'or_tier'
      $pool_2_allowable_qty = $eligible_tier.qty_2.to_i
      if !(samples_to_discount.length > 0)
        samples_to_discount.concat samples.select { |sample| sample.properties['_collections'].include? $eligible_tier.pool_2 }.take($pool_2_allowable_qty)
      end
    when 'and_tier'
      $pool_2_allowable_qty = $eligible_tier.qty_2.to_i
      samples_to_discount.concat samples.select { |sample| sample.properties['_collections'].include? $eligible_tier.pool_2 }.take($pool_2_allowable_qty)
  end

  puts samples_to_discount

  # DISCOUNT SAMPLES
  samples_to_discount.each do |item|
    item_discount = item.variant.price
    item.change_line_price(item.line_price - item_discount, message: $eligible_tier.message)
  end
end


# ASSESS WHICH CHECKOUT PROMOTION TO APPLY
checkout_gift_code_prefixes.map!(&:upcase)

$checkout_promo_applied = false

if !cart.discount_code.nil?
  compare_code = cart.discount_code.code.upcase
  $checkout_promo_applied = checkout_gift_code_prefixes.find { |prefix| compare_code.start_with? prefix }
end

# APPLY CHECKOUT DISCOUNT
if $checkout_promo_applied
  $checkout_gifts.each do |item|
    if item.properties['_checkout_code'].upcase.start_with? $checkout_promo_applied
      item_discount = item.variant.price
      item.change_line_price(item.line_price - item_discount, message: cart.discount_code.code)
    end
  end
end

#<Yotpo 3>
Input.cart.line_items.each do |line_item|
  
  variant_id = line_item.variant.id
  swell_points_used = line_item.properties["_swell_points_used"]
  swell_redemption_id = line_item.properties["_swell_redemption_id"]
  swell_redemption_token = line_item.properties["_swell_redemption_token"]
  swell_discount_type = line_item.properties["_swell_discount_type"]
  is_free_product = false
  
  # if there's a free product, reduce the price of this line item by the price of the product
  if swell_discount_type && swell_discount_type.eql?("product")
    if calculate_token(swell_redemption_id, variant_id) == swell_redemption_token
      total_line_item_price_cents = line_item.line_price_was.cents
      each_item_price_cents = total_line_item_price_cents / line_item.quantity
      new_price = total_line_item_price_cents - each_item_price_cents
      line_item.change_line_price(Money.new(cents: new_price), message: "Rewards")
      is_free_product = true
    end
  end

  # if there's a fixed amount discount and this isn't a free product
  # distribute the fixed amount discount based on the percentage of the total this line item represents
  if swell_discount_used and !is_free_product
    price_cents = line_item.line_price_was.cents
    cart_cents = Input.cart.subtotal_price_was.cents
    discount_cents = (price_cents / cart_cents) * swell_discount_amount_cents
    line_item.change_line_price(Money.new(cents: price_cents - discount_cents), message: "Rewards")
  end
end

#</Yotpo 3>

##### Special Bundle --- START


DISCOUNT_PERCENTAGE = 10.0
DISCOUNT_LIMIT = 4

outer_discount_counter = 0
discount_counter = 0

sorted_line_items = Input.cart.line_items.sort_by { |line_item| line_item.variant.price }

Input.cart.line_items.each do |line_item|
  product = line_item.variant.product
  if product.tags.include?('special-bundle')

    byo_bundle_property = line_item.properties.any? { |property| property.first == "BYO Bundle" }
     if byo_bundle_property
          outer_discount_counter += 1
     end
  end
end

if outer_discount_counter >= 4
sorted_line_items.each do |line_item|
  

  product = line_item.variant.product
  
  byo_bundle_property = line_item.properties.any? { |property| property.first == "BYO Bundle" }


  if product.tags.include?('special-bundle') && byo_bundle_property
    # Calculate the discounted price for one unit
    one_unit_discounted_price = line_item.variant.price * (1.0 - DISCOUNT_PERCENTAGE / 100.0)

    # Calculate the regular price for the remaining units
    remaining_units_price = line_item.variant.price * (line_item.quantity - 1)

    # Calculate the new line price: discounted price for one unit + regular price for the remaining units
    new_line_price = one_unit_discounted_price + remaining_units_price

    # Apply the new line price to the line item
    line_item.change_line_price(new_line_price, message: "BUILD YOUR ROUTINE")
    
    # Increment the discount counter
    discount_counter += 1
  end
 end
end

##### Special Bundle --- END

# GENERATED BY THE SHOPIFY SCRIPT CREATOR APP
class Campaign
  def initialize(condition, *qualifiers)
    @condition = (condition.to_s + '?').to_sym
    @qualifiers = PostCartAmountQualifier ? [] : [] rescue qualifiers.compact
    @line_item_selector = qualifiers.last unless @line_item_selector
    qualifiers.compact.each do |qualifier|
      is_multi_select = qualifier.instance_variable_get(:@conditions).is_a?(Array)
      if is_multi_select
        qualifier.instance_variable_get(:@conditions).each do |nested_q|
          @post_amount_qualifier = nested_q if nested_q.is_a?(PostCartAmountQualifier)
          @qualifiers << qualifier
        end
      else
        @post_amount_qualifier = qualifier if qualifier.is_a?(PostCartAmountQualifier)
        @qualifiers << qualifier
      end
    end if @qualifiers.empty?
  end

  def qualifies?(cart)
    return true if @qualifiers.empty?
    @unmodified_line_items = cart.line_items.map do |item|
      new_item = item.dup
      new_item.instance_variables.each do |var|
        val = item.instance_variable_get(var)
        new_item.instance_variable_set(var, val.dup) if val.respond_to?(:dup)
      end
      new_item
    end if @post_amount_qualifier
    @qualifiers.send(@condition) do |qualifier|
      is_selector = false
      if qualifier.is_a?(Selector) || qualifier.instance_variable_get(:@conditions).any? { |q| q.is_a?(Selector) }
        is_selector = true
      end rescue nil
      if is_selector
        raise "Missing line item match type" if @li_match_type.nil?
        cart.line_items.send(@li_match_type) do |item|
          next false if item.nil?
          qualifier.match?(item)
        end
      else
        qualifier.match?(cart, @line_item_selector)
      end
    end
  end

  def run_with_hooks(cart)
    before_run(cart) if respond_to?(:before_run)
    run(cart)
    after_run(cart)
  end

  def after_run(cart)
    @discount.apply_final_discount if @discount && @discount.respond_to?(:apply_final_discount)
    revert_changes(cart) unless @post_amount_qualifier.nil? || @post_amount_qualifier.match?(cart)
  end

  def revert_changes(cart)
    cart.instance_variable_set(:@line_items, @unmodified_line_items)
  end
end

class BuyXGetX < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, buy_item_selector, get_item_selector, discount, buy_x, get_x, max_sets)
    super(condition, customer_qualifier, cart_qualifier)
    @line_item_selector = buy_item_selector
    @get_item_selector = get_item_selector
    @discount = discount
    @buy_x = buy_x
    @get_x = get_x
    @max_sets = max_sets == 0 ? nil : max_sets
  end

  def run(cart)
    raise "Campaign requires a discount" unless @discount
    return unless qualifies?(cart)
    return unless cart.line_items.reduce(0) {|total, item| total += item.quantity } >= @buy_x
    applicable_buy_items = nil
    eligible_get_items = nil
    discountable_sets = 0

    # Find the items that qualify for buy_x
    if @line_item_selector.nil?
      applicable_buy_items = cart.line_items
    else
      applicable_buy_items = cart.line_items.select { |item| @line_item_selector.match?(item) }
    end

    # Find the items that qualify for get_x
    if @get_item_selector.nil?
      eligible_get_items = cart.line_items
    else
      eligible_get_items = cart.line_items.select {|item| @get_item_selector.match?(item) }
    end

    # Check if cart qualifies for discounts and limit the discount sets
    purchased_quantity = applicable_buy_items.reduce(0) { |total, item| total += item.quantity }
    discountable_sets = (@max_sets ? [purchased_quantity / @buy_x, @max_sets].min : purchased_quantity / @buy_x).to_i
    return if discountable_sets < 1
    discountable_quantity = (discountable_sets * @get_x).to_i
    # Apply the discounts (sort to discount lower priced items first)
    eligible_get_items = eligible_get_items.sort_by { |item| item.variant.price }
    eligible_get_items.each do |item|
      break if discountable_quantity == 0
      if item.quantity <= discountable_quantity
        @discount.apply(item)
        discountable_quantity -= item.quantity
      else
        new_item = item.split({ take: discountable_quantity })
        @discount.apply(new_item)
        cart.line_items << new_item
        discountable_quantity = 0
      end
    end
  end
end

class ConditionalDiscountCodeRejection < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, li_match_type, line_item_qualifier, message)
    super(condition, customer_qualifier, cart_qualifier, line_item_qualifier)
    @li_match_type = (li_match_type.to_s + '?').to_sym
    @message = message == "" ? "This discount code cannot be used at this time" : message
  end

  def run(cart)
    return unless cart.discount_code
    cart.discount_code.reject({message: @message}) if qualifies?(cart)
  end
end

class Qualifier
  def partial_match(match_type, item_info, possible_matches)
    match_type = (match_type.to_s + '?').to_sym
    if item_info.kind_of?(Array)
      possible_matches.any? do |possibility|
        item_info.any? do |search|
          search.send(match_type, possibility)
        end
      end
    else
      possible_matches.any? do |possibility|
        item_info.send(match_type, possibility)
      end
    end
  end

  def compare_amounts(compare, comparison_type, compare_to)
    case comparison_type
      when :greater_than
        return compare > compare_to
      when :greater_than_or_equal
        return compare >= compare_to
      when :less_than
        return compare < compare_to
      when :less_than_or_equal
        return compare <= compare_to
      when :equal_to
        return compare == compare_to
      else
        raise "Invalid comparison type"
    end
  end
end
  
class CustomerTagQualifier < Qualifier
  def initialize(match_type, match_condition, tags)
    @match_condition = match_condition
    @invert = match_type == :does_not
    @tags = tags.map(&:downcase)
  end

  def match?(cart, selector = nil)
    return true if cart.customer.nil? && @invert
    return false if cart.customer.nil?
    customer_tags = cart.customer.tags.to_a.map(&:downcase)
    case @match_condition
      when :match
        return @invert ^ ((@tags & customer_tags).length > 0)
      else
        return @invert ^ partial_match(@match_condition, customer_tags, @tags)
    end
  end
end

class ConditionalDiscount < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, line_item_selector, discount, max_discounts)
    super(condition, customer_qualifier, cart_qualifier)
    @line_item_selector = line_item_selector
    @discount = discount
    @items_to_discount = max_discounts == 0 ? nil : max_discounts
  end

  def run(cart)
    raise "Campaign requires a discount" unless @discount
    return unless qualifies?(cart)
    applicable_items = cart.line_items.select { |item| @line_item_selector.nil? || @line_item_selector.match?(item) }
    applicable_items = applicable_items.sort_by { |item| item.variant.price }
    applicable_items.each do |item|
      break if @items_to_discount == 0
      if (!@items_to_discount.nil? && item.quantity > @items_to_discount)
        discounted_items = item.split(take: @items_to_discount)
        @discount.apply(discounted_items)
        cart.line_items << discounted_items
        @items_to_discount = 0
      else
        @discount.apply(item)
        @items_to_discount -= item.quantity if !@items_to_discount.nil?
      end
    end
  end
end

class PostCartAmountQualifier < Qualifier
  def initialize(comparison_type, amount)
    @comparison_type = comparison_type
    @amount = Money.new(cents: amount * 100)
  end

  def match?(cart, selector = nil)
    total = cart.subtotal_price
    compare_amounts(total, @comparison_type, @amount)
  end
end

class Selector
  def partial_match(match_type, item_info, possible_matches)
    match_type = (match_type.to_s + '?').to_sym
    if item_info.kind_of?(Array)
      possible_matches.any? do |possibility|
        item_info.any? do |search|
          search.send(match_type, possibility)
        end
      end
    else
      possible_matches.any? do |possibility|
        item_info.send(match_type, possibility)
      end
    end
  end
end

class SubscriptionItemSelector < Selector
  def initialize(match_type)
    @invert = match_type == :not
  end

  def match?(line_item)
    @invert ^ !line_item.selling_plan_id.nil?
  end
end

class PostCartAmountIncDiscCodeQualifier < PostCartAmountQualifier
  def initialize(comparison_type, amount)
    super(comparison_type, amount)
  end

  def match?(cart, selector = nil)
    total =
    case cart.discount_code
      when CartDiscount::Percentage
        if cart.subtotal_price >= cart.discount_code.minimum_order_amount
          cart_subtotal_without_gc = cart.line_items.reduce(Money.zero) do |total, item|
            total + (item.variant.product.gift_card? ? Money.zero : item.line_price)
          end
          gift_card_amount = cart.subtotal_price - cart_subtotal_without_gc
          cart_subtotal_without_gc * ((Decimal.new(100) - cart.discount_code.percentage) / 100) + gift_card_amount
        else
          cart.subtotal_price
        end
      when CartDiscount::FixedAmount
        if cart.subtotal_price >= cart.discount_code.minimum_order_amount
          [cart.subtotal_price - cart.discount_code.amount, Money.zero].max
        else
          cart.subtotal_price
        end
      else
        cart.subtotal_price
    end
    compare_amounts(total, @comparison_type, @amount)
  end
end

class CartAmountQualifier < Qualifier
  def initialize(behaviour, comparison_type, amount)
    @behaviour = behaviour
    @comparison_type = comparison_type
    @amount = Money.new(cents: amount * 100)
  end

  def match?(cart, selector = nil)
    total = cart.subtotal_price
    if @behaviour == :item || @behaviour == :diff_item
      total = cart.line_items.reduce(Money.zero) do |total, item|
        total + (selector&.match?(item) ? item.line_price : Money.zero)
      end
    end
    case @behaviour
      when :cart, :item
        compare_amounts(total, @comparison_type, @amount)
      when :diff_cart
        compare_amounts(cart.subtotal_price_was - @amount, @comparison_type, total)
      when :diff_item
        original_line_total = cart.line_items.reduce(Money.zero) do |total, item|
          total + (selector&.match?(item) ? item.original_line_price : Money.zero)
        end
        compare_amounts(original_line_total - @amount, @comparison_type, total)
    end
  end
end

class ProductTagSelector < Selector
  def initialize(match_type, match_condition, tags)
    @match_condition = match_condition
    @invert = match_type == :does_not
    @tags = tags.map(&:downcase)
  end

  def match?(line_item)
    product_tags = line_item.variant.product.tags.to_a.map(&:downcase)
    case @match_condition
      when :match
        return @invert ^ ((@tags & product_tags).length > 0)
      else
        return @invert ^ partial_match(@match_condition, product_tags, @tags)
    end
  end
end

class PercentageDiscount
  def initialize(percent, message)
    @discount = (100 - percent) / 100.0
    @message = message
  end

  def apply(line_item)
    line_item.change_line_price(line_item.line_price * @discount, message: @message)
  end
end

class QuantityLimit < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, line_item_selector, limit_by, limit)
    super(condition, customer_qualifier, cart_qualifier)
    @limit_by = limit_by
    @line_item_selector = line_item_selector
    @per_item_limit = limit
  end

  def run(cart)
    return unless qualifies?(cart)
    item_limits = {}
    to_delete = []
    if @per_item_limit == 0
      cart.line_items.delete_if { |item| @line_item_selector.nil? || @line_item_selector.match?(item) }
    else
      cart.line_items.each_with_index do |item, index|
        next unless @line_item_selector.nil? || @line_item_selector.match?(item)
        key = nil
        case @limit_by
          when :product
            key = item.variant.product.id
          when :variant
            key = item.variant.id
          when :cart
            key = 1
        end

        if key
          item_limits[key] = @per_item_limit if !item_limits.has_key?(key)
          needs_limiting = true if item.quantity > item_limits[key]
          needs_deleted = true if item_limits[key] <= 0
          max_amount = item.quantity - item_limits[key]
          item_limits[key] -= needs_limiting ? max_amount : item.quantity
        else
          needs_limiting = true if item.quantity > @per_item_limit
          max_amount = item.quantity - @per_item_limit
        end

        if needs_limiting
          if needs_deleted
            to_delete << index
          else
            item.split(take: max_amount)
          end
        end
      end

      if to_delete.length > 0
        del_index = -1
        cart.line_items.delete_if do |item|
          del_index += 1
          true if to_delete.include?(del_index)
        end
      end

    end
  end
end

CAMPAIGNS = [
  QuantityLimit.new(
    :any,
    nil,
    PostCartAmountIncDiscCodeQualifier.new(
      :less_than_or_equal,
      99.99
    ),
    ProductTagSelector.new(
      :does,
      :match,
      ["gwp--holiday-bag"]
    ),
    :product,
    0
  ),
  BuyXGetX.new(
    :all,
    nil,
    nil,
    SubscriptionItemSelector.new(
      :is
    ),
    ProductTagSelector.new(
      :does,
      :match,
      ["gwp--subscription"]
    ),
    PercentageDiscount.new(
      100,
      "Free Gift"
    ),
    1,
    1,
    1
  ),
  BuyXGetX.new(
    :all,
    nil,
    nil,
    ProductTagSelector.new(
      :does,
      :match,
      ["special-bundle"]
    ),
    ProductTagSelector.new(
      :does,
      :match,
      ["special-bundle--gwp"]
    ),
    PercentageDiscount.new(
      100,
      "FREE ZIPPY BAG"
    ),
    4,
    1,
    1
  ),
  QuantityLimit.new(
    :all,
    CustomerTagQualifier.new(
      :does,
      :match,
      ["redeemed_lucky_dip_duo"]
    ),
    nil,
    ProductTagSelector.new(
      :does,
      :match,
      ["gwp--skinscare-surprise-promo"]
    ),
    :product,
    0
  ),
    QuantityLimit.new(
    :all,
    nil,
    nil,
    ProductTagSelector.new(
      :does,
      :match,
      ["limit-1"]
    ),
    :product,
    1
  ),
  ConditionalDiscountCodeRejection.new(
    :any,
    nil,
    nil,
    :any,
    ProductTagSelector.new(
      :does,
      :match,
      ["stop-discount-code"]
    ),
    "Sorry discounts cannot be used with certain items in your cart."
  )
].freeze

CAMPAIGNS.each do |campaign|
  campaign.run_with_hooks(Input.cart)
end

##### GWP Holiday Bag V2 --- START

# Configurations
QUALIFYING_PRODUCT_TAG = 'Alémais 2024'
LIMITED_PRODUCT_TAG = 'gwp--holiday-bag'
MINIMUM_PURCHASE_AMOUNT = Money.new(cents: 10000) # $100 in cents

# Helper method to find qualifying line items
def qualifying_line_items(cart, tag)
  cart.line_items.select { |line_item| line_item.variant.product.tags.include?(tag) }
end

# Calculate the total value of qualifying items
def qualifying_total(line_items)
  totalGWP = Money.zero
  line_items.each do |line_item|
    totalGWP += Money.new(cents: line_item.line_price.cents) # Ensure consistent Money object
  end
  totalGWP
end

# Remove the limited product if conditions are not met
def limit_product(cart, tag)
  cart.line_items.reject! do |line_item|
    if line_item.variant.product.tags.include?(tag)
      line_item.change_line_price(Money.zero, message: "Removed due to insufficient purchase") # Fix 0 to Money.zero
      true # Remove this item from the cart
    else
      false # Keep this item in the cart
    end
  end
end

# Main Script Logic
qualifying_items = qualifying_line_items(Input.cart, QUALIFYING_PRODUCT_TAG)
totalGWP = qualifying_total(qualifying_items)

if totalGWP < MINIMUM_PURCHASE_AMOUNT
  limit_product(Input.cart, LIMITED_PRODUCT_TAG)
end



##### GWP Holiday Bag V2 --- END


Output.cart = Input.cart
Output.cart = cart


