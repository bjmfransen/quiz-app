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
    return this._data[field]; 
  }
  getDotWalk(field){
    //allows for dot-walking into the properties of this._data
    let fields = field.split('.');
    let o = this._data;
    let property;
    
    while ((property = fields.shift())){
      o = o[property];
      if (typeof o != 'object'){
        return o;
      }
    }
    
    return;
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
    console.log('appendQuestion', Qn)
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

// export {
//   Quiz,
//   Round,
//   Question
// }

test();
function test(){
  const q1 = new Question();
  q1
    .set('text', 'What is the capital of Rwanda?', 'en')
    .set('answer', 'Kigali', 'en')
    .set('label', 'Capital', 'en')
    .set('text', 'Wat is de hoofdstad van Rwanda?', 'nl')
    .set('answer', 'Kigali', 'nl')
    .set('label', 'Hoofdstad', 'nl')
    .set('difficulty', 2)
    .set('category', 'Geography');
  const q2 = new Question();
  q2
    .set('text', 'What is the longest mountain range on earth?', 'en')
    .set('answer', 'Andes', 'en')
    .set('label', 'Mountain range', 'en')
    .set('text', 'Wat is de langste bergketen ter wereld?', 'nl')
    .set('answer', 'Andes', 'nl')
    .set('label', 'Bergketen', 'nl')
    .set('difficulty', 1)
    .set('category', 'Geography');
  const q3 = new Question();
  q3
    .set('text', 'Who wrote Patsy Cline\'s Crazy?', 'en')
    .set('answer', 'Willie Nelson', 'en')
    .set('label', 'Name', 'en')
    .set('text', 'Wie schreef Patsy Cline\'s Crazy?', 'nl')
    .set('answer', 'Willie Nelson', 'nl')
    .set('label', 'Naam', 'nl')
    .set('difficulty', 3)
    .set('category', 'Music');
  const q4 = new Question();
  q4
    .set('text', 'Whose first solo album was titled Tubular Bells?', 'en')
    .set('answer', 'Mike Oldfield', 'en')
    .set('label', 'Name', 'en')
    .set('text', 'Wie debuteerde met Tubular Bells?', 'nl')
    .set('answer', 'Mike Oldfield', 'nl')
    .set('label', 'Naam', 'nl')
    .set('difficulty', 2)
    .set('category', 'Music');
  const r1 = new Round();
  r1.set('name', 'Ronde 1').set('category', 'Geography');
  r1.appendQuestion(q1).appendQuestion(q2)

  const r2 = new Round();
  r2.set('name', 'Ronde 2').set('category', 'Music');
  r2.appendQuestion(q3).appendQuestion(q4)

  const qz = new Quiz('BJ0001');
  qz.appendRound(r1).appendRound(r2);

  console.log('======\n'+qz)
  console.log(q2.getDotWalk('languages.nl.text'))

}
