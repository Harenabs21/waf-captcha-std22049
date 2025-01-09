const apiKey = window.WAF_API_KEY 


const form = document.getElementById("numberForm");
        const input = document.getElementById("input");
        const output = document.getElementById("output");
        const captchaContainer = document.getElementById("my-captcha-container");
        let wafToken = null;
        let isCaptchaSolved = false;
        let currentIndex = 0;

        function showCaptcha(onSuccessCallback) {
            AwsWafCaptcha.renderCaptcha(captchaContainer, {
                apiKey: apiKey,
                onSuccess: (token) => {
                    wafToken = token;
                    isCaptchaSolved = true;
                    onSuccessCallback();
                },
                onError: (error) => {
                    console.error("Captcha Error:", error);
                },
            });
        }

        async function fetchWithCaptchaHandling(url, index) {
            if (!isCaptchaSolved) {
                return new Promise((resolve) => {
                    showCaptcha(() => resolve(fetchWithCaptchaHandling(url, index)));
                });
            }
        
            try {
                const response = await fetch(url, {
                    headers: {
                        "x-aws-waf-token": wafToken || "",
                    },
                });
        
                if (response.status === 403) {
                    throw new Error('Forbidden');
                } else if (response.status === 405) {
                    throw new Error('CAPTCHA required');
                }
        
                return response;
            } catch (error) {
                console.error(`Error fetching ${url}:`, error.message);
                throw error;
            }
        }
        
        async function startSequence(n) {
            output.innerHTML = "";
            for (let i = currentIndex + 1; i <= n; i++) {
                try {
                    const response = await fetchWithCaptchaHandling("https://api.prod.jcloudify.com/whoami", i);
                    output.innerHTML += `<div>${i}. Forbidden</div>`;
                } catch (error) {
                    output.innerHTML += `<div>${i}. Error: ${error.message}</div>`;
                }
                await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay
            }
        }


        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const n = parseInt(input.value, 10);
            if (n < 1 || n > 1000) {
                alert("Please enter a number between 1 and 1000.");
                return;
            }
            startSequence(n);
        });