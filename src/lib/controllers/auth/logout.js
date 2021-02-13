module.exports = (req, res) => {
  if (!req.session.userId && req.session.userId !== 0) return res.redirect(303, '/')

  /* delete req.session.userId */  // prima avevo fatto così, questo si potrebbe fare per non distruggere la s.

  req.session.destroy((err) => {
    if (err) {}
    res.redirect(303, '/')
  })
}