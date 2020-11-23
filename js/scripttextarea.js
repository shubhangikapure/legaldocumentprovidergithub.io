(function($){
  //General preparations
  Backbone.sync = function(method, model, success, error){
    success();
  }
  
  
  
  // Generic, very simply model type for any type of form entry that we can extend
  var FormModel = Backbone.Model.extend({
    defaults: {
      value: '',
    }
  });
  
  
  
  //Input class definition
  var input = {};
  input.model = FormModel.extend({
    defaults: {
      placeHolder: 'Enter Title Here...',
      class: '',
      warn: 'a title',
      size: '20px'
    }
  });
  input.view = Backbone.View.extend({
    events: {
      'mouseover': 'mouseover',
      'mouseout': 'mouseout',
      'click .clearButton': 'clearInput',
      'keypress input': 'checkKey',
      'change input': 'updateValue'
    },
    initialize: function() {
      _.bindAll(this, 'render', 'checkKey', 'clearInput', 'doSubmit',  'mouseover', 'mouseout', 'updateValue');
      this.render();
    },
    render: function() {
      if (this.model.get('class')) {
        $(this.el).addClass(this.model.get('class'));
      }
      $(this.el).append('<div class="clearButton inputClear"></div>');
      $(this.el).append('<input type="text" placeHolder="'+this.model.get('placeHolder')+'" style="font-size: '+this.model.get('size')+'">');
      this.clickable = true;
      return this;
    },
    checkKey: function(e) {
      if (e.keyCode === 13) {
        this.doSubmit();
      }/* else if (e.keyCode === 0) {
        this.clearInput();
      }*/
    },
    doSubmit: function() {
      var thisVal = this.updateValue();
      if (thisVal.length > 0) {
      } else {
        alert('Hey, you need to '+this.model.get('warn')+' before you can submit this post!');
      }
    },
    clearInput: function() {
      $('input', this.el).val('');
    },
    mouseover: function() {
      if (this.clickable) {
        $('.clearButton', this.el).css('visibility', 'visible');
      }
    },
    mouseout: function() {
      if (this.clickable) {
        $('.clearButton', this.el).css('visibility', 'hidden');
      }
    },
    updateValue: function() {
      var thisVal  = $('input', this.el).val();
      this.model.set('value', thisVal);
      return thisVal;
    },
  });

  

  //WYSIWYG editor class definition
  var editor = {};
  editor.model = FormModel.extend({
    defaults: {
      buttons: [
        {id: 'bold', title: 'Bold (Ctrl/Cmd+B)', class: 'bold'},
        {id: 'italic', title: 'Italic (Ctrl/Cmd+I)', class: 'italic'},
        {id: 'underline', title: 'Underline (Ctrl/Cmd+U)', class: 'underline'},
        {id: 'strikethrough', title: 'Strikethrough', class: 'strikethrough'}
      ]
    }
  });
  editor.view = Backbone.View.extend({
    events: {
      'change #editor': 'updateValue',
    },
    initialize: function() {
      _.bindAll(this, 'render', 'makeToolbar', 'updateValue');
      this.render();
    },
    render: function() {
      $(this.el).addClass('subArea');
      $(this.el).append('<div class="editorBox"></div>');
      $('.editorBox', this.el).append('<div class="btn-toolbar" data-role="editor-toolbar" data-target="#editor"></div>');/*editorToolbar*/
      this.makeToolbar();
      $('.editorBox', this.el).append('<div id="editor" class="editorTextArea" contenteditable="true"></div>');/*class="editorTextArea"*/
      $('#editor').wysiwyg();
      this.clickable = true;
      return this;
    },
    makeToolbar: function() {
      $('.btn-toolbar', this.el).append('<div class="btn-group"></div>');/*.editorToolbar, editorGrp*/
      var toolbar = $('.btn-toolbar .btn-group', this.el);/*.editorToolbar .editorGrp*/
      var buttons = this.model.get('buttons');
      $(buttons).each(function(i, v){
        toolbar.append('<a class="btn" data-edit="'+v.id+'" title="'+v.title+'"><i class="icon-'+v.class+'"></i></a>');/*editorBtn*/
      });
    },
    updateValue: function() {
      var thisVal  = $('#editor').cleanHtml();
      this.model.set('value', thisVal);
      return thisVal;
    },
  });
  
  
  
  //Tag class definition
  var tag = {};
  tag.model = FormModel.extend({
    defaults: {
      title: '',
      exists: false,
      parent: $('#container'),
    }
  });
  tag.view = Backbone.View.extend({
    events: {
      'mouseover': 'mouseover',
      'mouseout': 'mouseout',
      'click .clearButton': 'kill',
    },
    initialize: function() {
      _.bindAll(this, 'render', 'kill', 'mouseover', 'mouseout');
      this.render();
    },
    render: function() {
      $(this.el).addClass('tagRow');
      $(this.el).html(this.model.get('title'));
      $(this.el).append('<div class="clearButton tagClose"></div>');
      this.clickable = true;
      return this;
    },
    mouseover: function() {
      if (this.clickable) {
        $('.clearButton', this.el).show();
      }
    },
    mouseout: function() {
      if (this.clickable) {
        $('.clearButton', this.el).hide();
      }
    },
    kill: function() {
      if (this.clickable) {
        this.clickable = false;
        var that = this;
        $(this.el).animate({opacity: 0}, 500, function(){
          $(that.el).remove();
          this.model.destroy();
        });
      }
    }
  });
  tag.collection = Backbone.Collection.extend({
    model: tag.model,
  });
  
  
  
  //Form submit
  var submit = {};
  submit.model = Backbone.Model.extend({
    defaults: {
      counter: 0
    },
  });
  submit.view = Backbone.View.extend({
    events: {
      'click': 'send',
    },
    initialize: function() {
      _.bindAll(this, 'render', 'send');
      this.render();
    },
    render: function() {
      $(this.el).addClass('submit');
      $(this.el).html('Submit!');
      this.clickable = true;
      return this;
    },
    send: function() {
      this.model.set('counter', this.model.get('counter') + 1);
    },
  });
  
  

  //Container class definition
  var container = {};
  container.collection = Backbone.Collection.extend({
    model: FormModel
  });
  container.model = Backbone.Model.extend({
  });
  container.view = Backbone.View.extend({
    el: $('body'),
    initialize: function() {
      _.bindAll(this, 'render', 'appendItem', 'newTag', 'makeTagDialog', 'validate');
      this.collection = new container.collection();
      this.fields = [];
      this.render();
    },
    render: function() {
      $('body').append('<div id="container"></div>');
      this.container = $('body #container');
      
      var title = new input.model({
        placeHolder: 'Enter Title Here...',
        class: 'subArea titleArea',
        warn: 'a title',
      });
      this.appendItem(new input.view({model: title}).el);
      
      this.appendItem(new editor.view({model: new editor.model()}).el);
      this.makeTagDialog();
      
      var submitButton = new submit.view({model: new submit.model()});
      this.listenTo(submitButton.model, 'change:counter', this.validate);
      $(this.container).append(submitButton.el);
      
      return this;
    },
    appendItem: function(view) {
      this.collection.add(view.model);
      $(this.container).append(view);
    },
    makeTagDialog: function() {
      this.container.append('<div class="subArea tagDialog"></div>');
      var tags = $('.tagDialog', this.container);
      tags.append('<div class="tagArea"></div>');
      var tagInput = new input.view({
        model: new input.model({ 
          placeHolder: 'Tag Your Post...',
          class: 'tagInput',
          warn: 'at least one tag',
          size: '16px',
          value: ''
        })
      });
      tagInput.addTag = function() {
        if (this.model.get('value').length) {
          this.collection.add(new tag.model({
            title: this.model.get('value')
          }));
        }
        this.clearInput();
      };
      tagInput.model.on('change:value', tagInput.addTag, tagInput);
      this.appendItem(tagInput.el);
      $('.tagInput .clearButton').css('marginTop', '-2px');
      
      tagInput.collection = new tag.collection();
      tagInput.collection.on('add', this.newTag);
    },
    newTag: function(model) {
        thisView = new tag.view({model: model});
        thisView.parent = this;
        $('.tagArea', this.container).append(thisView.el);
    },
    validate: function(){
      alert('Form validation launched!');
      var form = [];
      this.collection.each(function(value) {
        form.push(value);
      });
    }
  });

  new container.view({model: container.model});
})(jQuery);