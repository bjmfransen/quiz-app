//QuizJS v0.1 - es6
class BaseObject {
  constructor(){
    this._data = {};
    return this;
  }
  
  loadJSON(json){
    Object.assign(this._data, json);
    return this;
  }
  
  slice(...fields){ //convert the arguments to an array named fields
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
  
  set(field, value){ 
    // console.log('super', field, value)
    this._data[field] = value;
    return this; 
  }
  get(field){ 
    let defaultValue;

    switch (field){
      case 'rounds':
      case 'roundIds':
        defaultValue = [];
        break;
    }

    return this._data[field] || defaultValue;
  }
  getValues(fields){
    return fields.map(field => {
      return this.get(field);
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
    this._data.rounds.push(round);
    
    return this;
  }
  
  eachRound(fn){
    this._data.rounds.forEach(fn)
    
    return this;
  }
  
  set(field, value){
    switch (field){
      case 'name':
      case 'description':
        this._data[field] = value;
    }
    
    return this;
  }
  
  toArray(){
    var result = [];
    
    result.push(`Name: ${this.get('name')}`);
    this.eachRound(round => {
      result = result.concat(round.toArray())
    })
    return result;
  }
  
  toString(){
    return this.toArray().join('\n')
  }
}

class Round extends BaseObject {
  constructor(){   
    super();
    this._data.questions = [];
    return this;
  }
  
  expand(){//should't this go into QuizMeteor? - creating Questions by id only makes sense in a Mongo context
    this._data.questionIds = this._data.questions.map(questionId => {
      return new Question(questionId)
    })
    
    return this;
  }
  
  appendQuestion(Qn){
    this._data.questions.push(Qn);
    return this;
  }
  
  eachQuestion(fn){
    this._data.questions.forEach(fn);
    return this;
  }
   
  get(field){
    switch (field){
      case 'caption':       
        return getCaption(this);
      default:
        return super.get(field);
    }
    
    return;
  }
  
  set(field, value){
    switch (field){
      case 'name':
      case 'category':
        super.set(field, value);
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
  
  toArray(){
    var result = [];
    result.push(`Name ${this.get('name')} - ${this.get('category')} [${this._data.questions.length}]`);
    this.eachQuestion(q => {
      result = result.concat(q.toArray())
    })

    return result;
  }
  
  toString(){
    return this.toArray().join('\n');
  }
}

//Round helper functions
const getCaption = (round) => {
  return this.get('name');
}

class Question extends BaseObject {
  constructor(){
    super();
    this._data.languages = {}
  }
  
  get(field, language){
    switch (field){
      case 'text':    
      case 'answer':  
      case 'label':   
        return this._data.languages[language][field]
      case 'question': 
        return this._data.languages[language]
      default:
        return super.get(field)
    }
  }
  
  set(field, value, language){
    switch (field){
      case 'text': 
      case 'answer':  
      case 'label':   
      case 'question':
        setQuestion(field, value, language, this._data.languages);
        return this;
        
      //use fallthrough for default case; handle only the present values
      case 'difficulty':
      case 'category':
        return super.set(field, value);
        
      //if the field-value is not a valid option, do nothing and return the object
      default:
        return this;
    }
  }
  
  toArray(){
    let result = [];
    for (let lng in this._data.languages){
      result.push(lng+':');
      result.push(`Q: ${this.get('text', lng)}`)
      result.push(`A: ${this.get('answer', lng)}`)
      result.push(`L: ${this.get('label', lng)}`)
      result.push(`Diff: ${this.get('difficulty')}, cat: ${this.get('category')}`)
    }
    
    return result;
  }
  
  toString(){
    return this.toArray().join('\n');
  }
}

//Question helper functions
const setQuestion = (field, value, language, languages) => {
  if (typeof languages[language] === 'undefined'){
    languages[language] = {}
  }
  
  if (field == 'text' || field == 'answer' || field == 'label'){
    languages[language][field] = value;    
  }
  
  return this;
}

export {
  Quiz,
  Round,
  Question
}
