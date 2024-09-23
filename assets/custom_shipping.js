
    document.addEventListener('DOMContentLoaded', function () {
      const mainShipping = document.getElementById('main-shipping');
      const languages = window.languages;

      function Shipping() {
        let trackingStatus = false;
        let trackingData = {};
        const formData = {};

        function fetchOrderTracking(formData) {
          const gotoEndpoint = 'https://knt2uf7y9h.execute-api.ap-southeast-2.amazonaws.com/07-2020';
          const data = new URLSearchParams(formData);

          fetch(gotoEndpoint + '/tracking-events?' + data.toString())
            .then((response) => response.json())
            .then((response) => {
              trackingData = response;
              trackingStatus = true;
              render();
            })
            .catch((error) => {
              console.log(error);
              trackingStatus = false;
              render();
            });
        }

        function handleFormSubmit(formData) {
          formData.SameSite = 'None';
          fetchOrderTracking(formData);
        }

        function handleResetTracking() {
          trackingData = {};
          trackingStatus = false;
          render();
        }

        function handleChange(event) {
          formData[event.target.name] = event.target.value;
        }

        function handleSubmit(event) {
          event.preventDefault();
          handleFormSubmit(formData);
        }

        function TrackingForm() {
          return `
            <div class="ContentWidth">
              <div class="OrderTracking__Form">
                <div class="Form__Panel">
                  <h1 class="heading heading--secondary">${languages.shipping.title}</h1>
                  <form onsubmit="return false;" class="form">
                    <div class="input">
                      <input oninput="handleChangeProxy(event)" type="email" class="input__field" id="email_address" name="email" required aria-label="${languages.shipping.form.emailPlaceholder}" autofocus />
                      <label class="input__label" for="email_address">${languages.shipping.form.email}</label>
                    </div>
                    <div class="input">
                      <input oninput="handleChangeProxy(event)" type="text" class="input__field" id="orderNo" name="orderNo" required aria-label="${languages.shipping.form.orderNumber}" />
                      <label class="input__label" for="orderNo">${languages.shipping.form.orderNumber} ${languages.shipping.form.orderNumberPlaceholder}</label>
                    </div>
                    <div class="input">
                      <button type="submit" class="Form__Submit button button--primary button--full" onclick="handleSubmitProxy(event)">${languages.shipping.form.submit.toUpperCase()}</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          `;
        }

        function handleChangeProxy(event) {
          handleChange(event);
        }

        function handleSubmitProxy(event) {
          handleSubmit(event);
        }

        function TrackingResult(order) {
          function orderDetails() {
            if (!order.success) {
              return `
                <div class="ContentWidth">
                  <div class="OrderTracking__UnavailableContainer">
                    <div class="RoundedPanel RoundedPanel--secondary">${window.languages.shipping.unavailable}</div>
                    <p><button type="button" class="button button--secondary" onclick="handleResetTracking()">TRACK A DIFFERENT ORDER</button></p>
                  </div>
                </div>
              `;
            }

            return `
              <div class="ContentWidth">
                <div class="Grid">
                  <div class="Grid__Cell 1/2--tablet-and-up 3/12--lap-and-up">
                    <div class="RoundedPanel OrderDetails__Panel RoundedPanel--secondary">
                      <h3 class="heading h3 heading--secondary">Order Details</h3>
                      <div class="OrderDetails__Container">
                        <div class="OrderDetails__Row">
                          <p class="heading h5 heading--secondary">Order Number</p>
                          <p class="OrderDetails__Value">${order.orderid}</p>
                        </div>
                        <div class="OrderDetails__Row">
                          <p class="heading h5 heading--secondary">Order Date</p>
                          <p class="OrderDetails__Value">${order.order_date}</p>
                        </div>
                        <div class="OrderDetails__Row tracking ${order.tracking_no}">
                          <p class="heading h5 heading--secondary">Tracking Number</p>
                          <p class="OrderDetails__Value">
                            <a href="${order.courier.url}" target="_blank" class="button button--primary button--full">${order.tracking_no}</a>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="Grid__Cell 1/2--tablet-and-up 3/12--lap-and-up">
                    <div class="RoundedPanel OrderDetails__Panel">
                      <h3 class="heading h3 heading--secondary">Order Status</h3>
                      <ul class="Order__Events Order__Events--us">
                        ${order.events.filter((e) => e.date != null).map((i) => `
                          <li class="OrderEvent ${i.active ? 'active' : ''}">
                            <p class="OrderEvent__Action">${i.event}</p>
                            <p class="OrderEvent__Date">${i.date}</p>
                          </li>
                        `).join('')}
                      </ul>
                      <div class="clearfix"></div>
                    </div>
                  </div>
                  <div class="Grid__Cell 1/2--lap-and-up">
                    <div class="RoundedPanel OrderDetails__Panel">
                      <h3 class="heading h3 heading--secondary">Stay in the loop</h3>
                      <div class="tracking-buttons">
                        <p>Keeping you up to date every step of the way. Visit our shipping partners for full delivery details.</p>
                        <div class="OrderTracking__ResultsButtons">
                          <a href="${order.courier.url}" class="button button--primary button--full track-with-courier ${order.courier.url}" target="_blank">TRACK WITH COURIER</a>
                          <button type="button" class="button button--primary button--full" onclick="handleResetTracking()">TRACK A DIFFERENT ORDER</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }

          return `
            <div class="OrderTracking__Results">
              <div class="OrderTracking__ResultsTitle">
                <div class="ContentWidth">
                  <h1 class="heading h1">${window.languages.shipping.title}</h1>
                </div>
              </div>
              ${orderDetails()}
            </div>
          `;
        }

        function render() {
          mainShipping.innerHTML = trackingStatus 
            ? TrackingResult(trackingData)
            : TrackingForm();
        }

        const urlSearchParams = new URLSearchParams(window.location.search);
        const initialFormData = {
          email: urlSearchParams.get('email'),
          orderNo: urlSearchParams.get('order')
        };

        if (initialFormData.email && initialFormData.orderNo) {
          fetchOrderTracking(initialFormData);
        } else {
          render();
        }

        window.handleChangeProxy = handleChangeProxy;
        window.handleSubmitProxy = handleSubmitProxy;
        window.handleResetTracking = handleResetTracking;
      }

      Shipping();
    });
