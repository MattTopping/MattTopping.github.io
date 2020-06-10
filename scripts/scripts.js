//Nav bar clicking
$(window).on('scroll', function() {
    var navbar = document.getElementById("nav");
    var navbarHeader = document.getElementById("nav--header");
    if(window.pageYOffset > 0) {
        navbar.style.padding = "2% 3%";
        navbar.style.backgroundColor = "rgba(12, 24, 44, 1)";
        navbarHeader.style.color = "rgba(255, 255, 255, 1)";
    }
    else{
        navbar.style.padding = "1% 3%";
        navbar.style.backgroundColor = "rgba(12, 24, 44, 0)";
        navbarHeader.style.color = "rgba(255, 255, 255, 0)";
    }
});