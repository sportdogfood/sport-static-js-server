    // Function to perform the main operations
    async function performSessionAssist() {
        const lastUpdated = getLastUpdated();
        console.log(`Session Assist Last Updated: ${lastUpdated}`);

        window.userMeta = {
            ...window.userMeta,
            landingPage: window.location.href,
        };

        // Delay to allow cookies to load completely
        setTimeout(() => {
            const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                const [name, value] = cookie.trim().split('=');
                acc[name] = decodeURIComponent(value);
                return acc;
            }, {});

            console.log("All cookies: ", cookies);

            window.fx_customerId = cookies['fx_customerId'] || null;
            window.fx_customer_id = cookies['fx_customer_id'] || null;
            window.fx_customer_em = cookies['fx_customer_em'] || null;
            window.fx_customerEmail = cookies['fx_customerEmail'] || null;
            window.fx_customerEm = cookies['fx_customerEm'] || null;
            window.fx_customerPin = cookies['fx_customerPin'] || null;
            window.fx_customerLastVisit = cookies['fx_customerLastVisit'] || null;

            window.userMeta = {
                ...window.userMeta,
                lastUpdated: getLastUpdated(),
                friendlyLastUpdated: getLastUpdated(),
            };

            window.userState = {
                ...window.userState,
                lastUpdated: getLastUpdated(),
            };

            window.userSession = {
                ...window.userSession,
                lastUpdated: getLastUpdated(),
                sessionId: cookies['fcsid'] || 'annon',
                sessionState: {
                    ...window.userSession.sessionState,
                    timeStarted: window.userSession.sessionState.timeStarted || getLastUpdated(),
                    secondsSpent: window.userSession.sessionState.secondsSpent || 0
                }
            };

            if (cookies['sporturl']) {
                let decodedSporturl = decodeURIComponent(decodeURIComponent(cookies['sporturl']));
                console.log("Decoded sporturl:", decodedSporturl);

                const indexOfFirstAmp = decodedSporturl.indexOf('&');
                if (indexOfFirstAmp > -1) {
                    decodedSporturl =
                        decodedSporturl.slice(0, indexOfFirstAmp) +
                        '?' +
                        decodedSporturl.slice(indexOfFirstAmp + 1);
                }
                const sporturlParams = parseUrlParams(decodedSporturl);
                console.log("Parsed sporturlParams:", sporturlParams);

                window.userMeta = {
                    ...window.userMeta,
                    sporturl: cookies['sporturl'],
                    decodedSporturl: decodedSporturl,
                    sporturlParams: sporturlParams,
                };

                if (sporturlParams['pn']) {
                    setCookie('fx_customerPin', sporturlParams['pn'], 7);
                    window.fx_customerPin = sporturlParams['pn'];
                }

                if (sporturlParams['ts']) {
                    const date = new Date(parseInt(sporturlParams['ts']));
                    const friendlyDate = date.toLocaleString('en-US', {
                        timeZone: 'America/New_York',
                    });
                    setCookie('fx_customerLastVisit', friendlyDate, 7);
                    window.fx_customerLastVisit = friendlyDate;
                }

                if (sporturlParams['em']) {
                    const decodedEmail = decodeURIComponent(sporturlParams['em']);
                    setCookie('fx_customerEm', decodedEmail, 7);
                    setCookie('fx_customerEmail', decodedEmail, 7);
                    window.fx_customerEm = decodedEmail;
                    window.fx_customerEmail = decodedEmail;
                }
            }

            window.userMeta = {
                ...window.userMeta,
                fx_customerId: window.fx_customerId,
                fx_customer_id: window.fx_customer_id,
                fx_customer_em: window.fx_customer_em,
                fx_customerEmail: window.fx_customerEmail,
                fx_customerEm: window.fx_customerEm,
                fx_customerPin: window.fx_customerPin,
                fx_customerLastVisit: window.fx_customerLastVisit,
            };

            console.log("Final userMeta before updating state:", window.userMeta);
            
            updateUserState(cookies);

            // Delay to allow calculations before firing session start
            setTimeout(() => {
                fireSessionStart();
                updateSessionState(window.userMeta);
            }, 500);
        }, 1000); // Delay added to ensure cookies are fully loaded
    }
