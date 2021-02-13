const mariadb = require('mariadb')

require('dotenv').config()

const { MARIADB_HOST, MARIADB_USER, MARIADB_PASS, MARIADB_DBNAME } = process.env



const pool = mariadb.createPool({host: MARIADB_HOST, user: MARIADB_USER, password: MARIADB_PASS, connectionLimit: 5});

(async function main() {
  let conn

  try {
    
    conn = await pool.getConnection();

    let res = await conn.query("SHOW DATABASES;")
    if (res.map(d => d.Database).includes(MARIADB_DBNAME)) await conn.query(`DROP DATABASE ${MARIADB_DBNAME};`)

    await conn.query(`CREATE DATABASE ${MARIADB_DBNAME};`)
    await conn.query(`USE ${MARIADB_DBNAME};`)

    await conn.query(
      `CREATE TABLE school(
      id INT PRIMARY KEY,
      topblock_name VARCHAR(50) NOT NULL,
      topblock_image VARCHAR(255) NOT NULL,
      topblock_title VARCHAR(50) NOT NULL,
      topblock_short VARCHAR(255) NOT NULL,
      callout_title VARCHAR(50) NOT NULL,
      callout_short VARCHAR(255) NOT NULL,
      active_courses LONGTEXT NOT NULL,
      not_active_courses LONGTEXT NOT NULL
      );`
    )
    await conn.query(
      `CREATE TABLE users(
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(50) NOT NULL,
      firstname VARCHAR(50) NOT NULL,
      lastname VARCHAR(50) NOT NULL,
      nickname VARCHAR(50) NOT NULL,
      email VARCHAR(50) NOT NULL,
      website VARCHAR(50) NOT NULL,
      publicinfo VARCHAR(50) NOT NULL,
      password VARCHAR(255) NOT NULL,
      salt VARCHAR(100) NOT NULL,
      active BOOL NOT NULL,
      role VARCHAR(100) NOT NULL,
      dashboardstyles_myteachingcoursesstyle VARCHAR(15) NOT NULL,
      dashboardstyles_mycoursesstyle VARCHAR(15) NOT NULL,
      dashboardstyles_activecoursesstyle VARCHAR(15) NOT NULL
      );`
    )
    await conn.query(
      `CREATE TABLE courses(
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(50) NOT NULL,
      slug VARCHAR(50) NOT NULL,
      image VARCHAR(255) NOT NULL,
      short VARCHAR(255) NOT NULL,
      start VARCHAR(50) NOT NULL,
      end VARCHAR(50) NOT NULL,
      language VARCHAR(50) NOT NULL,
      description VARCHAR(255) NOT NULL,
      teacher INT NOT NULL,
      students LONGTEXT NOT NULL,
      lessons LONGTEXT NOT NULL,
      selfenrollment BOOL NOT NULL
      );`
    )
    await conn.query(
      `CREATE TABLE lessons(
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(50) NOT NULL,
      start VARCHAR(50) NOT NULL,
      end VARCHAR(50) NOT NULL,
      language VARCHAR(50) NOT NULL,
      contents VARCHAR(255) NOT NULL,
      completed LONGTEXT NOT NULL
      );`
    )
    await conn.query(
      `INSERT INTO school(id, topblock_name, topblock_image, topblock_title,
        topblock_short,
        callout_title,
        callout_short,
        active_courses, not_active_courses)
      VALUES("0", "Tenjin School", "/img/uploads/school/school.jpg", "Learn on your schedule",
        "Anywhere, anytime. Enjoy risk-free with our 30-day, money-back guarantee.",
        "Become an instructor",
        "Top instructors from around the world teach millions of students on Tenjin School.",
        "[]", "[]");`
    )

  } catch (err) {
    throw(err)
  } finally {
    if (conn) conn.release()
    pool.end()
  }
  
})()