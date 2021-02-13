const { body, validationResult } = require('express-validator')

const LANGUAGES = require('../../data-other/locale-languages-trovatiacaso')



function rangeArray(from, to) {
  let arr = []
  for (let i = from; i <= to; i++) {
    arr.push(String(i))
  }
  return arr
}



const expVal = {
  
  compose: (...validations) => {

    let validationsArray = []
    function toArray(validations) {
      if (!Array.isArray(validations)) return validationsArray.push(validations)
      validations.forEach(val => toArray(val))
    }
    toArray(validations)

    return async (req, res, next) => {
      await Promise.all(validationsArray.map(validation => validation.run(req)));
  
      next()
    };
  },



  user: [
    body(['firstname', 'lastname', 'username', 'nickname', 'email'])
      .not().isEmpty().withMessage('Please fill all necessary fields'),

    body('username')
      .isLength({ min: 4 }).withMessage('The username must be at least 4 characters long'),
  
    body('nickname')
      .isLength({ min: 4 }).withMessage('The nickname must be at least 4 characters long'),
  
    body('email')
      .isEmail().withMessage('Insert a valid email')
      .normalizeEmail()
  ],

  userPassword: body('password')
    .not().isEmpty().withMessage('Please fill all necessary fields')
    .isLength({ min: 8 }).withMessage('The password must be at least 8 characters long')
    .matches(/\d/).withMessage('The password must contain at least a number')
    .matches(/\p{Ll}/u).withMessage('The password must contain at least a lower case letter')
    .matches(/\p{Lu}/u).withMessage('The password must contain at least an upper case letter'),

  userNewPass: body('newpass')
    .if((value, { req }) => req.body.newpass.length > 0)
    .isLength({ min: 8 }).withMessage('The new password must be at least 8 characters long')
    .matches(/\d/).withMessage('The new password must contain at least a number')
    .matches(/\p{Ll}/u).withMessage('The new password must contain at least a lower case letter')
    .matches(/\p{Lu}/u).withMessage('The new password must contain at least an upper case letter'),

  userAdmin: [
    body('role')
      .isIn(['student', 'teacher', 'admin']).withMessage('Insert a correct role'),

    body('active')
      .isIn(['true', 'false']).withMessage('The "active" field must be either "true" of "false"')
  ],



  lessonAndCourseDates: [
    body(['startDay', 'endDay'], 'Please pick dates and hours from the given options')
      .isIn(rangeArray(1, 30)),

    body(['startMonth', 'endMonth'], 'Please pick dates and hours from the given options')
      .isIn([ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ]),

    body(['startYear', 'endYear'], 'Please pick dates and hours from the given options')
      .isIn(rangeArray(new Date().getFullYear() - 30, new Date().getFullYear() + 29)),
    
    body(['startHour', 'endHour'], 'Please pick dates and hours from the given options')
      .isIn(rangeArray(0, 23)),

    body(['startMinute', 'endMinute'], 'Please pick dates and hours from the given options')
      .isIn(rangeArray(0, 59))
  ],

  lessonAndCourseLanguage: body('language')
    .isIn(LANGUAGES).withMessage('The language must be one of the options'),

  courseAdmin: [
    body('selfenrollment', 'invalid selfenrollment value')
      .isIn(['true', 'false']).withMessage('The "Self-enrollment" field must be either "true" of "false"'),

    // this one, to work, teachers must be loaded in req.teachers (in array form)
    body('teacher', 'invalid teacher value')
      .custom((value, { req }) => ['-1', ...req.teachers.map(t => String(t.id))].includes(value))
  ]
}



module.exports = { expVal }