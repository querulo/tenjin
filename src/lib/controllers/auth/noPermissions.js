module.exports = (req, res) => {
  res.render('error', { title: "You don't have the permissions to access this page" })
}