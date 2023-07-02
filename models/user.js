const mongodb = require("mongodb");
const getDb = require("../utils/database").getDb;

const ObjectId = mongodb.ObjectId;

class User {
  constructor(name, lastName, email, tel, id) {
    this.name = name;
    this.lastName = lastName;
    this.email = email;
    this.tel = tel;
    this.password = password;
    this._id = id ? ObjectId(id) : null;
  }

  save() {
    const db = getDb();
    return db.collection("users").insertOne(this);
  }

  getUser() {}
}

class AdminUser {
  constructor(userName, password) {
    this.userName = userName;
    this.password = password;
    this._id = ObjectId(id);
  }

  // login()

  // logout()
}

exports.User = User;
exports.AdminUser = AdminUser;
