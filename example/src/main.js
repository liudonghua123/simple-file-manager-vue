import Vue from 'vue';
import App from './App.vue';
import './plugins/ant-design-vue.js';
import { VueContext } from 'vue-context';
import 'vue-context/dist/css/vue-context.css';

Vue.component('VueContext', VueContext);

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app');
