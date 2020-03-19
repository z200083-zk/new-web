const fs = require('fs');
const path = require('path');
const Koa = require('koa')
const cors = require('koa2-cors');
const koaBody = require('koa-body');
const bodyParser = require('koa-bodyparser')
const router = require('koa-router')();
const staticFiles = require('koa-static')


const { createToken, decodeToken } = require('./routes/token');
const Sequelize = require('sequelize');
const config = require('./routes/serve');
const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        idle: 30000
    }
});

sequelize
    .authenticate()
    .then(() => {
        console.log('数据库连接成功')
    })
    .catch(err => {
        console.log('数据库连接失败', err)
    })

const UserModel = sequelize.define('users', {
    Id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,            // 主键
        autoIncrement: true,         // 自动递增
    },
    Username: Sequelize.STRING(100),
    Password: Sequelize.STRING(100),
    Email: Sequelize.STRING(100),
    Time: Sequelize.BIGINT,
}, {
    timestamps: false
})

UserModel.sync({ force: false })

const Op = Sequelize.Op;

const app = new Koa()

app.use(bodyParser())
app.use(staticFiles(path.join(__dirname, '/public'))); // 静态资源服务
app.use(cors()); // 跨域


app.use(router.routes());
app.use(router.allowedMethods());

// 登录
router.post("/login", async (ctx) => {
    let { loginName, password } = ctx.request.body;
    await UserModel.findAll({
        raw: true, where: {
            [Op.or]: [
                {
                    username: {
                        [Op.like]: loginName
                    }
                },
                {
                    email: {
                        [Op.like]: loginName
                    }
                }
            ],
            password: password
        }
    }).then(notes => {
        if (notes.length == 0) {
            ctx.body = {
                code: 400,
                msg: '用户不存在或密码错误'
            }
            return
        } else {
            let token = createToken(notes[0]);
            ctx.body = { code: 200, token, msg: '登录成功' }
        }

    })
})

// 注册
router.post("/sign", async (ctx) => {
    console.log(ctx.request.body)
    let { signName, signPassword, signEmail } = ctx.request.body;
    await UserModel.create({
        Username: signName,
        Password: signPassword,
        Email: signEmail,
        Time: Math.round(new Date() / 1000)
    }).then(notes => {
        ctx.body = { code: 200, notes, msg: '注册成功' }
    })
})

// 验证用户名邮箱是否已存在
router.post("/verify", async (ctx) => {
    let { signName } = ctx.request.body;
    console.log(signName)
    await UserModel.findAll({
        raw: true, where: {
            [Op.or]: [
                {
                    username: {
                        [Op.like]: signName
                    }
                },
                {
                    email: {
                        [Op.like]: signName
                    }
                }
            ]
        }
    }).then(notes => {
        if (notes.length == 0) {
            ctx.body = {
                code: 400,
                msg: '用户不存在'
            }
            return
        } else {
            ctx.body = { code: 200, msg: '该用户已存在' }
        }

    })
})

// 解码并验证
// let userToken = ctx.request.header.authorization;
// let detoken = decodeToken(userToken);

app.listen(20083, () => {
    console.log('监听端口' + 20083);
})