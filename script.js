const bookingForm = document.querySelector("#booking-form");
const formStatus = document.querySelector("#form-status");

if (bookingForm && formStatus) {
  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(bookingForm);
    const name = formData.get("name");
    const service = formData.get("service");
    const date = formData.get("date");

    formStatus.textContent = `Thank you, ${name}. Your ${service} request for ${date} has been received. We will contact you shortly to confirm your appointment.`;
    bookingForm.reset();
  });
}
