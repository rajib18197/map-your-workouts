'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workouts {
  #date = new Date();
  #id = Date.now() + '';

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat,lng]
    this.distance = distance; // in Km
    this.duration = duration; // in min
  }
}

class Running extends Workouts {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.pace();
  }

  pace() {
    this.pace = this.distance / this.duration;
    return this.pace;
  }
}

class Cycling extends Workouts {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.speed();
  }

  speed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #mapEvents;
  #workouts = [];
  constructor() {
    this._getPosition();
    inputType.addEventListener('change', this._toggleElevationField);
    form.addEventListener('submit', this._newWorkout.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert(`Could not get your position!`);
        }
      );
    }
  }

  _loadMap(position) {
    console.log(this);
    const { latitude, longitude } = position.coords;
    console.log(latitude, longitude);
    console.log(position);
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);
    console.log(this.#map);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvents = mapE;
    console.log(this.#mapEvents);
    form.classList.remove('hidden');
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    // prettier-ignore
    const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvents.latlng;
    console.log(lat, lng);
    let workout;

    // 2) if the workouts is Running then add Running
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // 1) check input data
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        alert(`Input have to be Positive Number!`);
      }
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // 3) if the workouts is Cycling then add Cycling
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        alert(`Inputs have to be positive Number!`);
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    console.log(workout);
    // 4) push new workout to the Workouts Array
    this.#workouts.push(workout);
    // 5) Render Workout Markar to the map
    this._renderWorkoutMarker(workout);
    // 6) Render Workout to the lists
    this._renderWorkoutMarkup(workout);
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 300,
          maxHeight: 50,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.distance}`)
      .openPopup();
  }
  _renderWorkoutMarkup(workout) {
    let markup = `
        <li class="workout workout--${workout.type}" data-id="">
          <h2 class="workout__title">Running on October 18</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">Km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">Min</span>
          </div>
    `;

    if (workout.type === 'running') {
      markup += `
         <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace}</span>
            <span class="workout__unit">Min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
      `;
    }

    if (workout.type === 'cycling') {
      markup += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed}</span>
            <span class="workout__unit">Km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
      `;
    }

    containerWorkouts.insertAdjacentHTML('beforeend', markup);
  }
}

new App();
