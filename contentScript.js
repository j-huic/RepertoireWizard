var callback = function(mutationsList, observer) {
    for(let mutation of mutationsList) {
        if(mutation.addedNodes.length) {
            var iframe = document.querySelector('iframe'); 
            if(iframe) {
                var buttondiv = iframe.contentDocument.querySelector(".board-btns");
                var dropdown = iframe.contentDocument.querySelector(".nextMovesSource");

                if(buttondiv) {
                    buttondiv.appendChild(buttondiv.firstElementChild.cloneNode(true));
                    observer.disconnect(); 
                }

                if(dropdown) {
                    dropdown.appendChild(dropdown.firstElementChild.cloneNode(true));
                    observer.disconnect(); 
                    return;
                }

            }
            console.log("Button div not found");
        }
    }
};

var observer = new MutationObserver(callback);
observer.observe(document, { childList: true, subtree: true });

