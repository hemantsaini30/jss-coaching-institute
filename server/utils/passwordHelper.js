// Deterministic password formula:
// serial = parseInt(userID digits only)
// password = "JSS" + ((serial * 7 + 123) % 900 + 100)

function generatePassword(userID) {
  const serial = parseInt(userID.replace(/\D/g, ''));
  const num = ((serial * 7 + 123) % 900) + 100;
  return `JSS${num}`;
}

module.exports = { generatePassword };