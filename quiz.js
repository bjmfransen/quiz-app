//QuizJS v0.1 - es6
// Detect Node.js
const NODEJS = ( typeof module !== 'undefined' && module.exports );

class BaseObject {
  /*
   *  BaseObject - base for Quiz, Round, Question
   */
  constructor(){  
    this._data = {};    //set up empty data structure
    return this;
  }
  
  loadJSON(json){
  /*
   *  Loads json data structure and adds to this._data
   *  Existing properties will be overwritten
   */  
    for (let prop in json){
      this._data[prop] = json[prop];
    }

    return this;
  }

  toJSON(){
  /*
   *  Exports json this._data
   */
    return this._data;
  }
  
  toString(){
    return JSON.stringify(this.toJSON());
  }
  
  slice(...fields){ 
  /*
   * Convert the arguments to an array named fields
   */
    const result = {};

    //if fields was already an array, it is now stored as the first element of an array
    if (fields.length === 1 && fields[0] instanceof Array){
      fields = fields[0];
    }

    fields.forEach(field => {
      result[field] = this._data[field];
    })

    return result;
  }
  
  setValue(field, value){ 
  /*
   *  Finds property field, and sets its value in this._data
   *  If the property does not exist, it is created, 
   *  otherwise it is overwritten.
   */
    this._data[field] = value;
    return this; 
  }
  setValueDotWalk(field, value){
  /*
   *  Field can contain dots.
   */
    const fields = field.split('.');
    const lastField = fields.pop();
    let o = this._data;
    let prop;

    while ((prop = fields.shift())){
      if (typeof o[prop] != 'object'){
        o[prop] = {}
      }
      o = o[prop];
    }
    o[lastField] = value;
    
    return this;
  }
  getValue(field){ 
  /*
   *  Finds the property field and returns its value
   *  If the property does not exist, undefined is returned
   */
    return this._data[field];
  }
  getValueDotWalk(field){
  /*
   *  Field can contain dots to access object properties
   */
    let o = this._data;
    let result = this._data;
    
    field.split('.').forEach(fld => {
      if (typeof result === 'object'){
        result = result[fld];
      }
    })
    
    return result;
  }
  getValues(fields){
  /*
   *  Fields is an array of property names
   *  getValue is called for each property in fields,
   *  an array containing the returned values is returned
   */
    return fields.map(field => {
      return this.getValue(field);
    })
  }
}

class Quiz extends BaseObject {
  constructor(name){
    super();
    this._data.name = name;
    this._data.rounds = [];
    
    return this;
  }

  sliceRounds(fields){
    /*
     *  returns array of objects, one object for each round
     *  each object contains the provided fields as keys, their value in the round as value
     *  - [] fields - array of field names (string)
     */
    return this._data.rounds.map(round => {
      return round.slice(fields);
    })
  }
  
  appendRound(round){
    round.setLanguage(this.language);
    this._data.rounds.push(round);
    
    return this;
  }
  
  eachRound(fn){
    this._data.rounds.forEach(fn)
    
    return this;
  }
  
  setLanguage(language){
    this.language = language;
    this.eachRound(round => {
      round.setLanguage(language);
    })

    return this;
  }

  toJSON(){
    let prop;
    let result = {};

    for (prop in this._data){
      if (prop === 'rounds'){
        result.rounds = this._data.rounds.map(round => {
          return round.toJSON();
        })        
      } else {
        result[prop] = this._data[prop]
      }
    }

    return result;
  }

  loadJSON(json){
    for (let prop in json){
      if (prop === 'rounds'){
        this._data.rounds = json.rounds.map(round => {
          return new Round().loadJSON(round);
        })
      } else {
        this._data[prop] = json[prop];
      }
    }

    return this;
  }
}

class Round extends BaseObject {
  constructor(){   
    super();
    this._data.questions = [];
    return this;
  }
  
  appendQuestion(question){
    question.setLanguage(this.language);
    this._data.questions.push(question);

    return this;
  }
  
  eachQuestion(fn){
    this._data.questions.forEach(fn);
    return this;
  }

  setLanguage(language){
    this.language = language;
    this.eachQuestion(question => {
      question.setLanguage(language);
    })

    return this;
  }

  getValue(field){
    switch (field){
      case 'caption':       
        return this._getCaption(this);
      default:
        return super.getValue(field);
    }
    
    return;
  }
  
  setValue(field, value){
    switch (field){
      case 'name':
      case 'category':
        super.setValue(field, value);
      default:
        return this;
    }
  }
  
  //complex getters
  //should really be tackled in QuizMeteor
  gettabData(){
    return {
      id: this.id,
      caption: this.caption
    }
  }
  
  toJSON(){
    let prop;
    let result = {};

    for (prop in this._data){
      if (prop === 'questions'){
        result.questions = this._data.questions.map(question => {
          return question.toJSON();
        })        
      } else {
        result[prop] = this._data[prop]
      }
    }

    return result;
  }

  loadJSON(json){
    for (let prop in json){
      if (prop === 'questions'){
        this._data.questions = json.questions.map(question => {
          return new Question().loadJSON(question);
        })
      } else {
        this._data[prop] = json[prop];
      }
    }

    return this;
  }

  _getCaption() {
    return this.getValue('name');
  }
}

class Question extends BaseObject {
  constructor(){
    super();
    this._data.languages = {}
  }
  
  getValue(field){
    switch (field){
      case 'text':    
      case 'answer':  
      case 'label':   
        return this._data.languages[this.language][field]
      case 'question': 
        return this._data.languages[this.language]
      default:
        return super.getValue(field)
    }
  }
  
  setValue(field, value, language){
    switch (field){
      case 'text': 
      case 'answer':  
      case 'label':   
      case 'question':
        this._setQuestion(field, value, language, this._data.languages);
        return this;
        
      //use fallthrough for default case; handle only the present values
      case 'difficulty':
      case 'category':
        return super.setValue(field, value);
        
      //if the field-value is not a valid option, do nothing and return the object
      default:
        return this;
    }
  }

  setLanguage(language){
    this.language = language;
  }

  _setQuestion(field, value, language, languages){
    if (typeof languages[language] === 'undefined'){
      languages[language] = {}
    }
    
    if (field == 'text' || field == 'answer' || field == 'label'){
      languages[language][field] = value;    
    }
    
    return this;
  }
}

if (NODEJS){
  // Load depdendencies
  // const fs = require("fs");
  // const JSZip = require("jszip");
  // const sizeOf = require("image-size");

  // Export module
  module.exports = {
    Quiz,
    Round,
    Question
  }
};
