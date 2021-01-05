import React from 'react';

const Page = () => {

    React.useEffect(() => {
        if(process.env.NODE_ENV === 'development') {
            location.href = `${(process.env.API_BASE_PATH || '/').replace(/\/$/, '')}${location.pathname}${location.search}${location.hash}`;
        } else {
    
        }
    }, []);

    return 'Loading...';
}

export default Page;