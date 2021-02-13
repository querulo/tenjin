const xssFilters = require('xss-filters')



// PER ORA L'HO USATO SOLO SULLA HOME ANON



module.exports = (req, res, next) => {
  res.locals.xss = {
    html: xssFilters.inHTMLData,
    singleQ: xssFilters.inSingleQuotedAttr,
    doubleQ: xssFilters.inDoubleQuotedAttr,
    unQ: xssFilters.inUnQuotedAttr
  }

  next()
}