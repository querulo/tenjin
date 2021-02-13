const autoDelete = (req, res, next) => {
  res.locals.flashes = req.session.flashes ? req.session.flashes : {}
  delete req.session.flashes

  function addFlash({type = '', style = '', intro = '', message = ''} = {}) {
    if (!req.session.flashes) req.session.flashes = {all: []}
    if (type && !req.session.flashes[type]) req.session.flashes[type] = []

    if (type) req.session.flashes[type].push({style, intro, message})
    req.session.flashes.all.push({type, style, intro, message})
  }

  res.addFlash = addFlash

  function addFlashSameReq({type = '', style = '', intro = '', message = ''} = {}) {
    if (!Object.keys(res.locals.flashes).length) res.locals.flashes = {all: []}
    if (type && !res.locals.flashes[type]) res.locals.flashes[type] = []

    if (type) res.locals.flashes[type].push({style, intro, message})
    res.locals.flashes.all.push({type, style, intro, message})
  }

  res.addFlashSameReq = addFlashSameReq

  next()
}



// questa è da rivedere bene... ma per ora non mi serve...

/* const manualDelete = (req, res, next) => {
  if (!req.session.flashes) req.session.flashes = {all: []}

  res.locals.flashes = req.session.flashes

  function addFlash({type = '', style = '', intro = '', message = ''} = {}) {
    if (type && !req.session.flashes[type]) req.session.flashes[type] = []

    if (type) req.session.flashes[type].push({style, intro, message})

    req.session.flashes.all.push({type, style, intro, message})
  }

  function deleteFlashes(type = 'all') {
    if (type === 'all') {
      for (key in req.session.flashes) {
        if (key !== 'deleteFlashes') delete req.session.flashes[key]
      }
      req.session.flashes.all = []
    } else {
      delete req.session.flashes[type]
    }
  }

  res.addFlash = addFlash
  res.deleteFlashes = deleteFlashes

  res.locals.flashes.deleteFlashes = deleteFlashes

  next()
} */



module.exports = (type = 'autoDelete') => {
  if (type === 'autoDelete') return autoDelete
  if (type === 'manualDelete') return manualDelete

  throw (new Error('FLASH_INVALID_MIDDLEWARE_OPTION'))
}







/*
---------------------------------- FLASH (autoDelete) - USE ----------------------------------

MOUNTING THE MIDDLEWARE

app.use(flash('autoDelete'))


ADDING A MESSAGE

res.addFlash({intro: '...', message: '...', style: '...', type: '...'})

(all 4 arguments are strings)
(all 4 arguments are optional, and default to "")
(if "type" is "" the message is only added to "all", with type: "")


ACCESSING ALL MESSAGES FROM VIEWS (example)

if (flashes.all) {
  flashes.all.forEach(flash => ... )
}


ACCESSING ALL MESSAGES OF ONE TYPE FROM VIEWS (example)

if (flashes.typeFoo) {
  flashes.typeFoo.forEach(flash => ... )
}


HOW DOES IT WORK

the messages are saved in req.session.flashes   (using express-session)
at each new Request the messages are deleted from the session and moved into res.locals


MESSAGES STRUCTURE

flashes: {
  all: [
    {type: '...', style: '...', intro: '...', message: '...'},
    {type: '...', style: '...', intro: '...', message: '...'},
    {type: '...', style: '...', intro: '...', message: '...'}
  ],
  typeFoo: [
    {style: '...', intro: '...', message: '...'},
    {style: '...', intro: '...', message: '...'}
  ]
  typeBar: [
    {style: '...', intro: '...', message: '...'}
  ]
}
*/