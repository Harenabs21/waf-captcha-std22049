window.WAF_API_KEY 


const form = document.getElementById("numberForm");
        const input = document.getElementById("input");
        const output = document.getElementById("output");
        const captchaContainer = document.getElementById("my-captcha-container");
        let wafToken = null;
        let isCaptchaSolved = false;

        function showCaptcha(onSuccessCallback) {
            AwsWafCaptcha.renderCaptcha(captchaContainer, {
                apiKey: window.WAF_API_KEY,
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

            const response = await fetch(url, {
                headers: {
                    "x-aws-waf-token": wafToken || "",
                },
            });

            if (response.status === 403) {
                isCaptchaSolved = false;
                return fetchWithCaptchaHandling(url, index);
            }

            return response;
        }

        async function startSequence(n) {
            output.innerHTML = "";
            for (let i = 1; i <= n; i++) {
                try {
                    const response = await fetchWithCaptchaHandling("https://api.prod.jcloudify.com/whoami", i);
                    if (response.status === 405) {
                        output.innerHTML += `<div>${i}. Forbidden</div>`;
                    } else {
                        output.innerHTML += `<div>${i}. Error: ${response.status}</div>`;
                    }
                } catch (error) {
                    output.innerHTML += `<div>${i}. Error: ${error.message}</div>`;
                }
                await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay
            }
        }

        async function startSequence(n) {
            output.innerHTML = "";
            for (let i = 1; i <= n; i++) {
                output.innerHTML += `<div>${i}. Sending request...</div>`;
                try {
                    const response = await fetchWithCaptchaHandling("https://api.prod.jcloudify.com/whoami", i);
                    if (response.status === 405) {
                        output.innerHTML += `<div>${i}. Forbidden</div>`;
                    } else {
                        output.innerHTML += `<div>${i}. Error: ${response.status}</div>`;
                    }
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