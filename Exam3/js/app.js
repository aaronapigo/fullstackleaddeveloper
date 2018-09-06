$(function() {
    var grid = $("#grid").kendoGrid({

        dataSource: { 
            type: "json",
            transport: {
            read: { 
                url: "/kendousers"
            }
           }
        },
        columns:[
            {
                field: "_id",
                title: "ID",
                width: "260px"
            },
            {
                field: "userName",
                title: "ID",
                width: "260px"
            }
            
        ]


    });
}); 