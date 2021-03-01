const geoErrors = {
  UNKNOWN_ERROR: 0,
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
};

const geoOptions = {
  enableHighAccuracy: true,
  maximumAge: 5 * 60 * 1000,
  timeout: 3 * 60 * 1000,
};

let watchId;

new Vue({
  el: '#app',
  template: `
  <div class="container-fluid">
    <h1 class="mt-3">Menu</h1>
    <div v-if="showCook">
      <p>Legal! Estamos preparando seu pedido:</p>
      <ul>
        <li v-for="item in pedido">#{{ item + 1}} {{ menu[item].nome }}</li>
      </ul>
      <small>Aguarde até a entrega</small>
    </div>
    <div v-else>
      <div v-if="geoCapable && !inAppOrders">
        <p><small>Quer agilizar o seu pedido e pedir por aqui?</small></p>
        <div v-if="denied">
          <em class="text-danger">Precisamos da sua localização atual para poder habilitar o pedido e pagamento por aqui.</em>
          <p><a href="#" @click.prevent="denied = false">Quer tentar de novo?</a></p>
        </div>
        <div v-else>
          <button type="button" class="btn btn-primary" :disabled="denied" data-bs-toggle="modal" data-bs-target="#geoEnable">Pedir aqui</button>
          <button type="button" class="btn btn-secondary" @click="denied = true">Não, vou aguardar o garçon</button>
        </div>
      </div>
      <div class="mt-3">
        <div class="card w-100 mb-3" v-for="(item, idx) in menu">
          <img :src="item.img" class="card-img-top" alt="" v-if="item.img" style="height: 200px; object-fit: cover">
          <div class="card-body">
            <div class="d-flex">
              <div class="form-check" v-if="inAppOrders">
                <input class="form-check-input" type="checkbox" :value="idx" v-model="pedido">
              </div>
              <div>
                <h5 class="card-title"><span class="text-muted">#{{ idx + 1 }}</span> {{ item.nome }}</h5>
                <h6 class="card-subtitle mb-2 text-muted">R$ {{ item.preco.toFixed(2).replace('.', ',') }}</h6>
                <p class="card-text" v-if="item.desc">{{ item.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="mb-4" v-if="inAppOrders">
        <hr>
        <button type="button" class="btn btn-primary" @click="showCook = true">Fazer pedido</button>
      </div>
      <div class="modal" tabindex="-1" id="geoEnable">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Habilitar pedido e pagamento</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>Você pode solicitar o seu pedido rapidamente aqui pelo menu e fazer o pagamento tudo por aqui sem precisar do garçon.</p>
              <p>Para isso, precisamos que compartilhe sua localização conosco, clique no botão habilitar abaixo para continuar.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary" @click="getPosition" data-bs-dismiss="modal">Habilitar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
  data() {
    return {
      geoCapable: 'geolocation' in navigator,
      insideArea: false,
      coords: {},
      denied: false,
      inAppOrders: false,
      menu: [
        { nome: 'Carijo do Cordão Azul', preco: 29.9, desc: 'Uma assinatura do nosso Masterchef Fernando Kawasaki. Delicioso filé de frango empanado em farinha panko, recheado com presunto e mussarela, acompanhado de arroz primavera, purê de batatas e legumes.', img: 'https://www.goomer.app/webmenu/boteco-vidottinho/product/307270/picture/large/200926005520' },
        { nome: 'Costelinha BBQ', preco: 29.9, desc: 'Deliciosas costelinhas defumadas artesanalmente e assadas lentamente, cobertas com molho BBQ. Servidas com arroz branco e fritas.', img: 'https://www.goomer.app/webmenu/boteco-vidottinho/product/307242/picture/large/200922145930' },
        { nome: 'Parmegiana de Carne', preco: 18.9, desc: 'Delicioso filé de Miolo de Alcatra empanado, coberto com molho de tomates e queijo gratinado. Servido com fritas e arroz branco.', img: 'https://www.goomer.app/webmenu/boteco-vidottinho/product/307168/picture/large/200922145940' },
        { nome: 'Frango Fit', preco: 25.9, desc: 'Delicioso filet de frango grelhado ao azeite de ervas, servido com arroz integral e legumes na manteiga.', img: 'https://www.goomer.app/webmenu/boteco-vidottinho/product/869983/picture/large/200922152546' },
        { nome: 'Saint Peter ao Molho de Camarão', preco: 53.9, desc: 'Um saboroso filé de Tilapia Saint Peter empanado servido com molho de camarão com espinafre, legumes e arroz branco.', img: 'https://www.goomer.app/webmenu/boteco-vidottinho/product/307295/picture/large/200922152723' },
        { nome: 'Refrigerante Pepsi', preco: 6.9, desc: '', img: '' },
        { nome: 'Refrigerante Guarana', preco: 6.9, desc: '', img: '' },
        { nome: 'Refrigerante H2O Limão', preco: 7.9, desc: '', img: '' },
      ],
      pedido: [],
      showCook: false,
    };
  },
  
  methods: {
    updatePosition(position) {
      this.coords = { lat: position.coords.latitude, lng: position.coords.longitude };
      this.checkArea();
    },
    getPosition() {
      navigator.geolocation.getCurrentPosition(this.updatePosition, this.positionError, geoOptions);
      watchId = navigator.geolocation.watchPosition(this.updatePosition, this.positionError, geoOptions);
      document.getElementById('geoEnable').modal('hide');
    },
    positionError(code, message) {
      if (code === geoErrors.PERMISSION_DENIED) this.denied = true;
      this.insideArea = false;
    },
    checkArea() {
      this.inAppOrders = true;
    },
  },

  unmounted() {
    if (watchId) navigator.geolocation.clearWatch(watchId);
  },
});
