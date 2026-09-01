document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('support-form');
    const successMessage = document.getElementById('form-success');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;
            
            // Loading state
            submitBtn.innerHTML = '<span>Gönderiliyor...</span>';
            submitBtn.disabled = true;
            
            const formData = new FormData(form);
            
            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    form.reset();
                    successMessage.textContent = 'Mesajınız başarıyla iletildi. Size en kısa sürede dönüş yapacağız.';
                    successMessage.style.color = '#4caf50';
                    successMessage.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
                    successMessage.style.borderColor = 'rgba(76, 175, 80, 0.2)';
                    successMessage.classList.remove('hidden');
                    
                    setTimeout(() => {
                        successMessage.classList.add('hidden');
                    }, 5000);
                } else {
                    throw new Error('Form submission failed');
                }
            } catch (error) {
                successMessage.textContent = 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
                successMessage.style.color = '#ff5252';
                successMessage.style.backgroundColor = 'rgba(255, 82, 82, 0.1)';
                successMessage.style.borderColor = 'rgba(255, 82, 82, 0.2)';
                successMessage.classList.remove('hidden');
                
                setTimeout(() => {
                    successMessage.classList.add('hidden');
                }, 5000);
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});
