const express = require("express")
const bodyParser = require("body-parser")
const getDay = require(__dirname+"/date.js")
const mongoose = require("mongoose");
const _ = require("lodash");

require('dotenv').config()

const app = express()
app.use(bodyParser.urlencoded({extended: true}))
app.set('view engine', 'ejs')
app.use(express.static("public"))

mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGODB_URI)

const itemSchema = {
    name: String
}
const Item = mongoose.model("Item",itemSchema)

const item1 = new Item({
    name: "Welcome to your todo list"
})
const item2 = new Item({
    name: "Hit + to add new task"
})
const item3 = new Item({
    name: "⬅ Hit this to complete your task"
})
const defaultItems = [item1, item2, item3]

// custom list schema
const customListSchema = {
    name: String,
    items: [itemSchema]
};
const List = mongoose.model("List", customListSchema);

let day = getDay()

app.get("/", (req,res)=>{
    Item.find({}, (err,results)=>{
        if(err){
            console.log(err)
        }else{
            if(results.length==0){
                Item.insertMany(defaultItems,(err)=>{
                    if(err){
                        console.log(err)
                    }else{
                        console.log("successfully added default items to DB")
                    }
                })
                res.redirect("/")
            }else{
                res.render("list",{day,items:results,listTitle: "Today"})
            }
        }
    })
})
app.post("/", (req,res)=>{

    let itemName = req.body.item;
    let listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if(listName=="Today"){
        item.save(); 
        res.redirect("/");
    }else{
        List.findOne({name: listName}, (err,foundList)=>{
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName);
        });
    }
})
// deleting todo list items
app.post("/delete", (req,res)=>{
    let checkedItemId = req.body.checkbox;
    let listName = req.body.listName;
    if(listName=="Today"){
        Item.findByIdAndRemove(checkedItemId, (err)=>{
            if(err){
                console.log(err);
            }else{
                console.log("successfully deleted the todo list item");
            }
        });
        res.redirect("/");
    }else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, results) => {
            if(err){
                console.log(err);
            }else{
                console.log("successfully deleted the custom todo list item");
                res.redirect("/"+listName);
            }
        });
    }
})


app.get("/:customListName", (req,res)=>{
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name: customListName}, (err,results) => {
        if(!err){
            if(!results){
                // create new custom list
                const list = new List({
                    name: customListName,
                    list: defaultItems
                });
                list.save();
                res.redirect("/"+customListName);
            }else{
                // show existing custom list
                res.render("list",{day,items:results.items,listTitle: customListName});
            }
        }else{
            console.log(err);
        }
    })
})



app.listen(3000, ()=>{
    console.log("Server started running on port 3000")
})