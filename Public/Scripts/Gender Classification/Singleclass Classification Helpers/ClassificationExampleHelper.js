// ClassificationExampleHelper.js
// Version: 0.0.1
// Event: Lens Initialized
// Description: This is one of the singleclass classification helper scripts that shows text when the class is found or lost

//@ui {"widget":"separator"}
// @input Component.Text text

if (!script.text) {
    debugPrint("Warning, Text component is not set");
    return;
}

script.api.onFound = function() {
    script.text.text = "Male";
};

script.api.onLost = function() {
    script.text.text = "Female";
};

function debugPrint(text) {
    print("ClassificationExampleHelper: " + text);
}
