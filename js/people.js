$("#header-wrapper").load("includes/header.html",function(){
    $("#footer").load("includes/footer.html",loaded());
}); 

// put your code here if you need to change the footer or the header
function loaded(){
    // resetting the current active element in the list
    $("#menu ul").children().removeClass("current_page_item");
    // selecting the correct active element
    $("#people").addClass("current_page_item");
}