export function copyToClipboard(value) {
  console.log("VALUE!!!", value);
  const element = document.createElement("textarea");
  element.value = value;
  // Add it to the document so that it can be focused.
  document.body.appendChild(element);
  // Focus on the element so that it can be copied.
  element.focus();
  element.setSelectionRange(0, element.value.length);
  // Execute the copy command.
  document.execCommand("copy");
  // Remove the element to keep the document clear.
  document.body.removeChild(element);
}

// copyToClipboard = () => {
//   // Create the textarea input to hold our text.
//   const element = document.createElement("textarea");
//   element.value = this._editor.getValue();
//   // Add it to the document so that it can be focused.
//   document.body.appendChild(element);
//   // Focus on the element so that it can be copied.
//   element.focus();
//   element.setSelectionRange(0, element.value.length);
//   // Execute the copy command.
//   document.execCommand("copy");
//   // Remove the element to keep the document clear.
//   document.body.removeChild(element);
// };
