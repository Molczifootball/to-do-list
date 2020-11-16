//fjhint esversion:6

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const ejs = require('ejs');
const date = require(__dirname+"/date.js");
const mongoose = require('mongoose');
const _ = require("lodash");

process.setMaxListeners(0);
console.log(date.getDate());

const app = express();

const workItems = [];

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true });

const itemsSchema = new mongoose.Schema({
  name:String
});
const Item = mongoose.model("Item",itemsSchema);
const WorkItem = mongoose.model("WorkItem",itemsSchema);

const item1 = new Item({
  name:"Welcome"
});
const item2 = new Item({
  name:"To add new item press +."
});
const item3 = new Item({
  name:"<----click here to set as done."
});
const defaultItems = [item1,item2,item3];

const listMainSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});
const List = mongoose.model("List", listMainSchema);

app.get("/", function(req,res){

  Item.find({},function(err, foundItems){
      if(foundItems.length===0){
        Item.insertMany(defaultItems,function(err) {
          if(err){
            console.log(err);
          }else {
            console.log("Successfully uploaded default items to DB.");
          }
        });
        res.redirect("/");
      }else {
        res.render("list", {listTitle: day, newListItems: foundItems});
      }
  });

  let day = date.getDate();
  });

app.get("/:customListName", function(req,res){
  const listName = _.capitalize(req.params.customListName);

  List.findOne({name:listName}, function(err,results){
    if(err){
      console.log(err);
    }else {
      if(!results) {
        //Create new list
      const listMain = new List({
        name: listName,
        items: defaultItems
              });
      listMain.save();
      res.redirect("/"+listName)
      }else {
        // Show existing list
        res.render("list",{listTitle: results.name, newListItems: results.items});
      }
    }
  });





});


app.post("/",function(req,res){
  //console.log(req.body);
  const item = new Item({
    name: req.body.newItem
  });
  let day = date.getDate();
  const listName = _.capitalize(req.body.list);

  if(listName === day){
    item.save();
    res.redirect("/");
  }else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }

  });

app.get("/work",function(req,res) {

  WorkItem.find({},function(err, foundWorkItems){
    if(foundWorkItems.length===0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }else {
          console.log("Successfully added default work list items to DB.");
        }
      });
    }else {
      res.render("list", {listTitle:"Work List",newListItems: foundWorkItems});
    };
});
res.redirect("/work");
});

app.get("/about",function(req,res) {
  res.render("about");
});

app.post("/delete", function(req,res){
  const deletedItemID = req.body.Delete;
  const listName = req.body.listName;
  let day = date.getDate();

  if(listName===day){
    Item.findByIdAndRemove(deletedItemID, function(err){
      if(!err){console.log("Successfully deleted item ID: "+ deletedItemID);}
      res.redirect("/");
    })
  }else {
    List.findOneAndUpdate({name: listName},{$pull:{items:{_id: deletedItemID}}}, function(err, foundList){
      if(!err){res.redirect("/"+listName);}
    })
  }
});
app.listen(3000, function() {
  console.log("Server started at port 3000");
});
