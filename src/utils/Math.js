const precesion = 6;
function round(number) {
    let x = parseFloat(number);
    return parseFloat(x.toFixed(precesion));
}
function add(a, b) {
    let x = round(a);
    let y = round(b);
    return round(((x * `1e${precesion}`) + (y * `1e${precesion}`)) / `1e${precesion}`);
}
function sub(a, b) {
    let x = round(a);
    let y = round(b);
    return round(((x * `1e${precesion}`) - (y * `1e${precesion}`)) / `1e${precesion}`);
}
function mul(a, b) {
    let x = round(a);
    let y = round(b);
    return round((x) * (y));
}
function div(a, b) {
    let x = round(a);
    let y = round(b);
    return round((x) / (y ));
}

function percent(n, p) {
    let N = round(n);
    let P = round(p);
    return round(N * (P / 100));
}

module.exports = {
    round,
    add,
    sub,
    mul,
    div,
    percent
}