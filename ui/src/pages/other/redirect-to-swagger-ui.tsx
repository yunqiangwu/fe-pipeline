import React from 'react';

const Page = ({ location }: any) => {

    React.useEffect(() => {
        if(process.env.NODE_ENV === 'development') {
            let gotoUrl = `${(process.env.API_BASE_PATH || '/').replace(/\/$/, '')}${location.pathname.startsWith('/swagger-ui') ? '' : '/swagger-ui'}${location.pathname}${location.search}${location.hash}`;
            window.location.href = gotoUrl;
        } else {
            let gotoUrl = `${(process.env.API_BASE_PATH || '/').replace(/\/$/, '')}${location.pathname.startsWith('/swagger-ui') ? '' : '/swagger-ui'}${location.pathname}${location.search}${location.hash}`;
            window.location.href = gotoUrl;
        }
    }, []);

    return 'Loading...';
}

export default Page;