/*
    ng-image-appear v1.11.5
    Copyright (c) 2016 Arun Michael Dsouza (amdsouza92@gmail.com)
    Licence: MIT
    Demo on CodePen - http://codepen.io/amdsouza92/full/aNQeWW/
*/

(function() {
    'use strict';

    // Declaring ngImageAppear module
    var ngImageAppear = angular.module('ngImageAppear', []);

    // Default background color for image wrapper
    var defaultBackgroundColor = '#f0f0f0';

    // ngImageAppear initialization code
    ngImageAppear.run(function() {

        // Creating default stylesheet for elements
        var defaultStylesheet,
            head = document.head;

        // Checking if default stylesheet already exists in DOM
        if(defaultStylesheet === undefined) {
            defaultStylesheet = document.createElement('style');

            // Default CSS stylesheet
            // Styles for elements + animations
            var css = '@animation .ngImageAppearLoader {width: 40px; height: 40px; position: absolute; left: calc((100% - 40px) / 2); top: calc((100% - 40px) / 2);} .ngImageAppearPlaceholder {position: relative; display: inline-block; background-size: cover; background-repeat: no-repeat; background-position: center center; background-color: '+defaultBackgroundColor+';}';
            
            // Adding CSS text to default stylesheet
            defaultStylesheet.appendChild(document.createTextNode(css));

            // Prepend default stylesheet to head 
            head.insertBefore(defaultStylesheet, head.firstChild);
        }
    });

    // ngImageAppear directive 
    ngImageAppear.directive('ngImageAppear',['$timeout', function($timeout) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {

                // Set default CSS classes for elements
                var defaultLoaderClass = 'ngImageAppearLoader',
                    defaultPlaceholderClass = 'ngImageAppearPlaceholder';

                // Fetching element attributes
                var transitionDurationAttr = attrs.transitionDuration, // Set transition duration
                    noLoaderAttr = element[0].hasAttribute('no-loader'), // Check if loader is to be hidden
                    placeholderAttr = attrs.placeholder, // Check if default placeholder image is to be shown
                    placeholderClassAttr = attrs.placeholderClass, // Set CSS class for placeholder (image wrapper)
                    placeholderStyleAttr = attrs.placeholderStyle, // Set CSS styles for placeholder (image wrapper)
                    bgColorAttr = attrs.bgColor, // Set loader wrapper background color
                    loaderImgAttr = attrs.loaderImg, // Set custom loader image
                    loaderClassAttr = attrs.loaderClass, // Set CSS class for loader element
                    loaderStyleAttr = attrs.loaderStyle, // Set custom styles for loader element
                    animationDurationAttr = attrs.animationDuration, // Set animation duration
                    animationAttr = attrs.animation, // Set animation type
                    isResponsiveAttr = element[0].hasAttribute('responsive'), // Check if image is to be set responsive or not
                    easingAttr = attrs.easing; // Set easing for transition/animation

                // Setting default loader attributes
                var loaderSrc = 'data:image/gif;base64,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',
                    defaultPlaceholder = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxNi4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB3aWR0aD0iNDIuNjVweCIgaGVpZ2h0PSIzMnB4IiB2aWV3Qm94PSIwIDAgNDIuNjUgMzIiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDQyLjY1IDMyIiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxnPg0KCTxnPg0KCQk8cGF0aCBmaWxsPSIjRDNEM0QzIiBkPSJNMCwwaDQyLjYzN2MwLjAyNCwwLjM1NCwwLjAwNCwwLjcxLDAuMDExLDEuMDY2YzAsMTAuMzEzLDAsMjAuNjI0LDAsMzAuOTM0SDBWMHogTTE1Ljg0OSwxMS41MDINCgkJCWMwLDIuOTYzLTAuMDAyLDUuOTI3LDAuMDAxLDguODkxYzMuNjQ0LDAuMDAzLDcuMjksMC4wMDMsMTAuOTM2LDBjMC4wMDItMi45NjQsMC4wMDItNS45MjcsMC04Ljg5MQ0KCQkJQzIzLjE0MSwxMS40OTgsMTkuNDk1LDExLjQ5OCwxNS44NDksMTEuNTAyeiIvPg0KCTwvZz4NCgk8Zz4NCgkJPHBhdGggZmlsbD0iI0QzRDNEMyIgZD0iTTE2LjUzNywxMi4xODZjMy4xODgsMCw2LjM3NSwwLDkuNTY0LDBjMC4wMDEsMi41MDksMC4wMDEsNS4wMTQtMC4wMDIsNy41MjENCgkJCWMtMy4xODgsMC4wMDMtNi4zNzUsMC4wMDMtOS41NjMsMEMxNi41MzMsMTcuMTk5LDE2LjUzMywxNC42OTQsMTYuNTM3LDEyLjE4NnogTTE3LjIxNSwxMi44N2MwLDIuMDUyLTAuMDAyLDQuMTAzLDAuMDAyLDYuMTU1DQoJCQljMC40NTcsMCwwLjkxNSwwLjAwMywxLjM3My0wLjAwNGMwLjQxLTAuNDA5LDAuODIxLTAuODIxLDEuMjMyLTEuMjMyYzAuMDU2LTAuMDU0LDAuMTA2LTAuMTIxLDAuMTgzLTAuMTQ3DQoJCQljMC42NjUtMC4yMjYsMS4zMzUtMC40NDEsMi0wLjY3MmMwLjIyNi0wLjY4MSwwLjQ1MS0xLjM2MSwwLjY3OS0yLjA0MmMwLjE3OSwwLjM1MiwwLjM1NCwwLjcwNywwLjUzMSwxLjA2MQ0KCQkJYzAuMDY2LDAuMTM1LDAuMTQzLDAuMjY2LDAuMTg4LDAuNDA4YzAuMjA3LDAuNjI2LDAuNDE3LDEuMjUxLDAuNjI1LDEuODc4YzAuMDIxLDAuMDc4LDAuMDg3LDAuMTM0LDAuMTQ1LDAuMTkNCgkJCWMwLjE5LDAuMTg1LDAuMzcxLDAuMzc3LDAuNTY1LDAuNTZjMC4yMjgsMCwwLjQ1MywwLjAwMiwwLjY4MywwYzAuMDAyLTIuMDUyLDAuMDAyLTQuMTAzLDAtNi4xNTUNCgkJCUMyMi42ODYsMTIuODY4LDE5Ljk1LDEyLjg2OCwxNy4yMTUsMTIuODd6Ii8+DQoJPC9nPg0KCTxwYXRoIGZpbGw9IiNEM0QzRDMiIGQ9Ik0xOS4zNzcsMTMuNTgyYzAuNDctMC4xMiwwLjk5NywwLjE0OSwxLjE3NSwwLjU5OWMwLjIwMywwLjQ1NSwwLjAxLDEuMDM2LTAuNDI0LDEuMjc5DQoJCWMtMC40MTgsMC4yNjEtMS4wMTYsMC4xNTEtMS4zMTYtMC4yMzljLTAuMzA0LTAuMzY1LTAuMjk4LTAuOTM5LDAuMDEyLTEuMjk5QzE4Ljk2NSwxMy43NTMsMTkuMTYzLDEzLjYzMiwxOS4zNzcsMTMuNTgyeiIvPg0KPC9nPg0KPC9zdmc+DQo=',           
                    loaderObject = {
                        'className': defaultLoaderClass
                    };

                // Attach CSS class to loader element if attribute is present
                if(loaderClassAttr !== undefined) {
                    loaderObject.className += ' '+loaderClassAttr;
                }

                // Set custom styles for loader element if attribute is present
                if(loaderStyleAttr !== undefined && loaderStyleAttr !== '') {
                    loaderObject.style = loaderStyleAttr;
                } 

                // Setting values for element attributes
                transitionDurationAttr = !transitionDurationAttr ? 0.7+'s' : transitionDurationAttr; // Set transition duration, default - 700ms
                bgColorAttr = !bgColorAttr ? defaultBackgroundColor : bgColorAttr, // Set default bg color for loader wrapper
                animationDurationAttr = !animationDurationAttr ? 0.7+'s' : animationDurationAttr; // Set transition duration, default - 700ms
                easingAttr = !easingAttr ? 'ease-in-out' : easingAttr; // Set easing for transition, default - ease-in-out

                // Set custom loader image if present
                loaderObject.src = loaderImgAttr ? loaderImgAttr : loaderSrc; 

                // DOM manipulation element variable declarations
                var imgElement, 
                    parentElement, 
                    imgWrapper, 
                    loaderElement,
                    wrapperStyles = 'background-color: '+bgColorAttr+'; ',
                    setImageElementWidth,
                    isSmall = false,
                    hasShownLoader = false,
                    animationText;

                // Add placeholder image if attribute is present
                if(placeholderAttr !== undefined) {
                    if(placeholderAttr === '') {
                        // Set default placeholder
                        wrapperStyles += 'background-image: url('+defaultPlaceholder+'); ';
                    }
                    else {
                        // Set custom placeholder
                        wrapperStyles += 'background-image: url('+placeholderAttr+'); ';
                    }
                }

                // Function to render loader
                function renderLoader() {

                    // Show loader in DOM
                    function showLoader() {
                        loaderElement = document.createElement('img'); 

                        // Adding loader object properties to loader element
                        for(var key in loaderObject) {
                            loaderElement[key] = loaderObject[key]; 
                        }

                        // Set loader element's visual styles to null
                        loaderElement.style.margin = loaderElement.style.padding =  loaderElement.style.border = loaderElement.style.borderRadius = 0;
                        loaderElement.style.boxShadow = loaderElement.style.float = 'none'; 
                        loaderElement.style.transform = loaderElement.style.outline = '';

                        // Add loader to DOM
                        imgWrapper.appendChild(loaderElement);
                        hasShownLoader = true;
                    }

                    // Check custom loader image extension
                    if(loaderImgAttr) {

                        // Get filetype of image
                        var fileType = loaderImgAttr.split('.').pop();
                        fileType = fileType.substring(0,3);

                        // Show loader if gif file is present
                        if(fileType === 'gif') {
                            showLoader();
                        }
                        // Else throw warning in console
                        else {
                            console.warn('The custom loader image should have a proper gif extension. Read full documentation here - https://github.com/ArunMichaelDsouza/ng-image-appear');
                        }
                    }
                    else {
                        showLoader();
                    }
                }
                
                // Function to remove loader element from DOM
                function removeLoader() {

                    // Check for loader visibility flags
                    if(!isSmall && !noLoaderAttr && hasShownLoader) {
                        var elementLoader = element[0].nextSibling; // Get loader of current element
                        if(elementLoader) {
                          elementLoader.parentNode.removeChild(elementLoader); // Remove rendered loader from DOM
                        }
                    }
                }

                // Function to remove wrapper element from DOM
                function removeImgWrapper() {

                    // Interval to check that image wrapper has been rendered in DOM
                    var intervalRemove = setInterval(function() {
                        if(imgWrapper !== undefined) {
                            clearInterval(intervalRemove);
                                
                            // Reset img wrapper CSS
                            imgWrapper.style.backgroundColor = imgWrapper.style.position = imgElement.style.width = imgElement.style.padding = imgElement.style.margin = imgElement.style.border = imgElement.style.borderRadius = imgElement.style.boxShadow = imgElement.style.float = imgElement.style.transform = imgElement.style.outline = '';

                            var wrapper = element[0].parentNode,
                                wrapperParent = wrapper.parentNode;
                            wrapperParent.replaceChild(element[0], wrapper); // Replace wrapper with actual image element
                        }
                    }, 1);
                }

                // Function to render image wrapper in DOM
                function renderImageWrapper(imgElementWidth, parentElementWidth, imgElementStyles) {

                    // Append placeholder styles to image wrapper if attribute is present
                    if(placeholderStyleAttr !== undefined && placeholderStyleAttr !== '') {
                        wrapperStyles += placeholderStyleAttr;
                    }

                    imgWrapper = document.createElement('div'); // Create wrapper element for image
                    imgWrapper.setAttribute('style', wrapperStyles); // Set default CSS for wrapper element
                    imgWrapper.className = defaultPlaceholderClass; // Attach default CSS placeholder class to image wrapper

                    // Append placeholder custom class if attribute is present
                    if(placeholderClassAttr !== undefined && placeholderClassAttr !== '') {
                        imgWrapper.className += ' '+placeholderClassAttr;
                    }

                    // Set default CSS width + unit for img element
                    if(isResponsiveAttr) {
                        // Set image element width in %
                        setImageElementWidth = Math.round((imgElementWidth * 100) / parentElementWidth);
                        setImageElementWidth+= '%';

                        // Set wrapper width to width of image element
                        imgWrapper.style.width = setImageElementWidth; 
                    }
                    else {
                        // Set image element width in px
                        setImageElementWidth = Math.round(imgElementWidth);
                        setImageElementWidth+= 'px';

                        // Set wrapper width to width of image element
                        imgWrapper.style.width = setImageElementWidth;
                    }

                    // Add image element styles to wrapper element
                    for(var property in imgElementStyles) {
                        imgWrapper.style[property] = imgElementStyles[property];
                    }

                    imgElement.style.width = '100%'; // Span image element to 100% width of wrapper
                    imgElement.style.padding = imgElement.style.margin = 0; // Set image element's margin/padding to 0

                     //PP
                    //parentElement.replaceChild(imgWrapper, imgElement); // Replace actual image element with wrapper element
                    imgElement.replaceWith(imgWrapper);
                    imgWrapper.appendChild(imgElement); // Append actual image element to wrapper element
                    // This will wrap the image element into a parent div tag used for showing the loader

                    // Show loader if 'no-loader' attribute is not present
                    if(!noLoaderAttr) {
                        var imgWrapperWidth = imgWrapper.offsetWidth;

                        // Show loader if wrapper width is more than 70px
                        imgWrapperWidth >= 70 ? renderLoader() : isSmall = true;
                    }

                    // Create animation sequence if attribute is present
                    if(animationDurationAttr !== undefined && animationDurationAttr !== '') {
                        animationText = animationAttr+' '+animationDurationAttr+' '+easingAttr;
                    }
                }

                // Function to get element's content width (without horizontal padding)
                function getElementContentWidth(element, type) {
                    var styles = window.getComputedStyle(element), // Get computed styles of element
                         padding = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight); // Get horizontal padding of element

                    // Return content width
                    if(type === 'wrapper') {
                        return element.offsetWidth - padding;
                    }
                    else {
                        return element.offsetWidth;
                    }
                }

                // Function to create image wrapper element
                function generateImageWrapper() {
                    imgElement = element[0], // Get image element
                    parentElement = imgElement.parentNode; // Get parent of image element

                    // Fire interval for checking image's width/height until calculated by DOM
                    var interval = setInterval(function() {

                        // If image element's width and height have been calculated by DOM then clear interval
                        if(imgElement.offsetWidth !== 0 && imgElement.clientHeight !== 0) {
                            clearInterval(interval);

                            // Get image element's visual styles and set it to wrapper element when rendered in DOM
                            var imgElementStyles = {
                                padding: window.getComputedStyle(imgElement).padding,
                                margin: window.getComputedStyle(imgElement).margin,
                                borderRadius: window.getComputedStyle(imgElement).borderRadius,
                                border: window.getComputedStyle(imgElement).border,
                                boxShadow: window.getComputedStyle(imgElement).boxShadow,
                                float: window.getComputedStyle(imgElement).float,
                                transform: window.getComputedStyle(imgElement).transform,
                                outline: window.getComputedStyle(imgElement).outline
                            };

                            // Set content width for parent, image elements
                            var parentElementWidth = getElementContentWidth(parentElement, 'wrapper'),
                                imgElementWidth = getElementContentWidth(element[0], 'image');

                            // Render image wrapper
                            renderImageWrapper(imgElementWidth, parentElementWidth, imgElementStyles);
                        }
                    }, 1);
                }

                // Function to load image into DOM
                function loadImage() {
                    removeLoader(); // Remove loader element once image is loaded

                    removeImgWrapper(); // Remove image wrapper from DOM
                        
                    // Make element appear with transition/animation
                    $timeout(function() {
                        element.css({
                            'transition': ' all '+ transitionDurationAttr +' '+ easingAttr, // Set element transition
                            'opacity': 1, // Show image element in view
                            'animation': animationAttr ? animationText : '' // Set element animation
                        });
                    }, 100); // Timeout to clear stack and rebuild DOM
                }

                // Function to initiate actual image load
                function onImageLoad() {
                    loadImage();
                    element.unbind('load');
                }

                // Function to initialise directive
                function initialize() {

                    // Hide image element from view
                    element.css({
                        'opacity': 0
                    });

                    // Create image wrapper for loader
                    generateImageWrapper();

                    // Check if image element has already been completely downloaded
                    if(element[0].complete) {
                        loadImage();
                    }
                    else {
                        // Else detect image load event
                        element.bind('load', onImageLoad);
                    }
                }

                // Function to get image element's source
                function getImageSrc() {
                    return element[0].getAttribute('src');
                }

                // Attach a watcher to image element's source
                scope.$watch(getImageSrc, function(newSrcValue, oldSrcValue) {

                    // Check if the image element's source has actually changed
                    if(newSrcValue && newSrcValue !== oldSrcValue) {
                        initialize(); // Re-initialise directive
                    }
                    
                });

                // Initialise directive
                initialize();
            }
        };
    }]);
})();
