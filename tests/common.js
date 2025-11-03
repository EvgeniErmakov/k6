// export LOAD_HOST='https://edc3-qa03.tech.mos.ru'
export const BASE_URL = (() => {
    const host = `${__ENV.LOAD_HOST}`;
    return host.startsWith('http://') ? host : `http://${host}`;
})();

export const POST_PARAMS = {
    headers: {'Content-Type': 'application/json'},
};