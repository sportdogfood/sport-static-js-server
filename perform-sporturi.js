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
