const fs = require('fs')
const path = require('path')



const COURSES_DIR = path.resolve(__dirname, '../../public/img/uploads/courses')
const SCHOOL_DIR = path.resolve(__dirname, '../../public/img/uploads/school')



async function coursesUpdateImage(id, tmpPath, ext) {
  let courseDir = COURSES_DIR + '/' + id
  let oldFileName = await fs.promises.readdir(courseDir)
  let oldFilePath = courseDir + '/' + oldFileName[0]

  await fs.promises.unlink(oldFilePath)

  let newFilePath = courseDir + '/' + id + '.' + ext
  await fs.promises.copyFile(tmpPath, newFilePath)

  await fs.promises.unlink(tmpPath)

  let newImageUrl = '/img/uploads/courses/' + id + '/' + id + '.' + ext

  return newImageUrl
}

async function coursesNewImage(id, tmpPath, ext) {
  let courseDir = COURSES_DIR + '/' + id

  await fs.promises.mkdir(courseDir)

  let newFilePath = courseDir + '/' + id + '.' + ext
  await fs.promises.copyFile(tmpPath, newFilePath)

  await fs.promises.unlink(tmpPath)

  let newImageUrl = '/img/uploads/courses/' + id + '/' + id + '.' + ext

  return newImageUrl
}

async function coursesNewImagePlaceholder(id) {
  let courseDir = COURSES_DIR + '/' + id

  await fs.promises.mkdir(courseDir)

  let placeholderPath = COURSES_DIR + '/placeholder.png'
  let newFilePath = courseDir + '/' + id + '.png'

  await fs.promises.copyFile(placeholderPath, newFilePath)

  let newImageUrl = '/img/uploads/courses/' + id + '/' + id + '.png'

  return newImageUrl
}



async function courseseDeleteImage(id) {
  let courseDir = COURSES_DIR + '/' + id

  await fs.promises.rmdir(courseDir, { recursive: true })
}



async function schoolUpdateImage(tmpPath, ext) {
  let oldFileName = await fs.promises.readdir(SCHOOL_DIR)
  oldFilePath = SCHOOL_DIR + '/' + oldFileName[0]

  await fs.promises.unlink(oldFilePath)

  let newFilePath = SCHOOL_DIR + '/' + 'school' + '.' + ext
  await fs.promises.copyFile(tmpPath, newFilePath)

  await fs.promises.unlink(tmpPath)

  let newImageUrl = '/img/uploads/school/school' + '.' + ext

  return newImageUrl
}



module.exports = {
  courses: {
    updateImage: coursesUpdateImage,
    newImage: coursesNewImage,
    newImagePlaceholder: coursesNewImagePlaceholder,
    deleteImage: courseseDeleteImage
  },

  school: {
    updateImage: schoolUpdateImage,
  }
}