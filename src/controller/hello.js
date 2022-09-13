function hello(req, res) {
    return res.json({
        status: 200,
        error: false,
        message: "Hey, I'm up!"
    })
}
module.exports = {
    hello
}