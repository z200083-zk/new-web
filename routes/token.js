// 引入模块依赖
const jwt = require('jsonwebtoken');

const secret = 'm.z200083.xyz'
// 生成token
const createToken = (data) => {
    let token = jwt.sign(data, secret, { expiresIn: 60*60*24 });
    return token
}

// 解码token
const decodeToken = (token) => {
    try {
        let data = jwt.verify(token, secret);
        return data
    } catch {
        return '已过期'
    }
}

module.exports = { createToken, decodeToken };