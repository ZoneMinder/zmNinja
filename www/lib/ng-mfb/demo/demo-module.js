var app = angular.module('test-app', ['demo']);

app.value('defaultValues', {
  positions: [{
    name: 'Position'
  },{
    value: 'tl',
    name: 'Top left'
  },{
    value: 'tr',
    name: 'Top right'
  },{
    value: 'br',
    name: 'Bottom right'
  },{
    value: 'bl',
    name: 'Bottom left'
  }],

  effects: [{
    name: 'Effect'
  },{
    value: 'slidein',
    name: 'Slide in + fade'
  },{
    value: 'zoomin',
    name: 'Zoom in'
  },{
    value: 'fountain',
    name: 'Fountain'
  },{
    value: 'slidein-spring',
    name: 'Slidein (spring)'
  }],

  methods: [{
      name: 'Method'
    },{
      value: 'click',
      name: 'Click'
    },{
      value: 'hover',
      name: 'Hover'
    }
  ],
  actions: [{
      name: 'Fire Main Action?'
  }, {
      value: 'fire',
      name: 'Fire'
  }, {
      value: 'nofire',
      name: 'Don\'t Fire'
  }]
});
