const express = require('express')

const { paramToRecord, permissions, courseIsActive } = require('../lib/middleware')



const courseidOrSlugToCourse = paramToRecord({
  param: 'idOrSlug',
  model: 'Course',
  errorMessage: "The course you're looking for doesn't exist"
})

const lessonidToLesson = paramToRecord({
  param: 'lesson_id',
  model: 'Lesson',
  errorMessage: "The lesson you're looking for doesn't exist"
})

const useridToUser = paramToRecord({
  param: 'user_id',
  model: 'User',
  errorMessage: "The user you're looking for doesn't exist"
})



module.exports = controller => {
  const router = express.Router()



  router.get('/:idOrSlug', courseidOrSlugToCourse, courseIsActive, controller.root)

  router.route('/:idOrSlug/edit')
    .get(courseidOrSlugToCourse, permissions.courseTeacherOrAdmin, controller.edit.get)
    .post(courseidOrSlugToCourse, permissions.courseTeacherOrAdmin, controller.edit.post)

  router.get('/:idOrSlug/self-enroll', courseidOrSlugToCourse, controller.selfenroll)



  // lesson

  router.get('/:idOrSlug/lesson/:lesson_id/remove', courseidOrSlugToCourse, lessonidToLesson, permissions.courseTeacherOrAdmin, controller.lesson.remove)

  router.get('/:idOrSlug/lesson/:lesson_id/move/:action', courseidOrSlugToCourse, lessonidToLesson, permissions.courseTeacherOrAdmin, controller.lesson.move)

  router.route('/:idOrSlug/lesson/:lesson_id/edit')
    .get(courseidOrSlugToCourse, lessonidToLesson, permissions.courseTeacherOrAdmin, controller.lesson.edit.get)
    .post(courseidOrSlugToCourse, lessonidToLesson, permissions.courseTeacherOrAdmin, controller.lesson.edit.post)

  router.route('/:idOrSlug/lesson/new')
    .get(courseidOrSlugToCourse, permissions.courseTeacherOrAdmin, controller.lesson.newL.get)
    .post(courseidOrSlugToCourse, permissions.courseTeacherOrAdmin, controller.lesson.newL.post)

  router.get('/:idOrSlug/lesson/:lesson_id/student-completion',
    courseidOrSlugToCourse, permissions.courseTeacherOrAdmin, lessonidToLesson,
    controller.lesson.completion
  )

  router.get('/:idOrSlug/lesson/:lesson_id/student-completion/users/:user_id/completed',
    courseidOrSlugToCourse, permissions.courseTeacherOrAdmin, lessonidToLesson, useridToUser,
    controller.lesson.completed
  )
  router.get('/:idOrSlug/lesson/:lesson_id/student-completion/users/:user_id/not-completed',
    courseidOrSlugToCourse, permissions.courseTeacherOrAdmin, lessonidToLesson, useridToUser,
    controller.lesson.notCompleted
  )



  return router
}