
  window.initializeAndUpdate = function(mode) {
    if (mode === 'password') {
      // Show the modal
      const recoverModal = document.getElementById('recoverModal');
      recoverModal.style.display = 'block';

      // Close button event
      const closeButton = document.getElementById('close-button');
      closeButton.addEventListener('click', function() {
        recoverModal.style.display = 'none';
      });

      // Continue button event (also closes the modal)
      const continueButton = document.getElementById('continue-button');
      continueButton.addEventListener('click', function() {
        recoverModal.style.display = 'none';
      });

      // Submit button event (handles password recovery request)
      const submitButton = document.getElementById('submit-button');
      submitButton.addEventListener('click', async function() {
        const newPassword = document.getElementById('input-recover-password').value;
        const customerId = window.fx_customerId_global; // Assuming the customer ID is stored globally

        if (!newPassword) {
          document.getElementById('recover-message').innerText = "Please enter a new password.";
          return;
        }

        const apiUrl = `https://sportcorsproxy.herokuapp.com/foxycart/customers/update-password/${customerId}`;
        const payload = {
          customerId,
          password: newPassword
        };

        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            const data = await response.json();
            document.getElementById('recover-message').innerText = "Password updated successfully.";
            document.getElementById('continue-button').style.display = 'block'; // Show the continue button
            submitButton.style.display = 'none'; // Hide the submit button
          } else {
            document.getElementById('recover-message').innerText = "Failed to update password. Try again.";
          }
        } catch (error) {
          console.error('Error during password recovery:', error);
          document.getElementById('recover-message').innerText = "An error occurred. Please try again.";
        }
      });
    }
  }
