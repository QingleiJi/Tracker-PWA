import { Route, BrowserRouter } from 'react-router-dom';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import Home from './pages/Home';
import MeasurementDetail from './pages/MeasurementDetail';

const App: React.FC = () => (
  <IonApp>
    <BrowserRouter basename="/tracker">
      <IonRouterOutlet>
        <Route exact path="/">
          <Home />
        </Route>
        <Route exact path="/:slug">
          <MeasurementDetail />
        </Route>
      </IonRouterOutlet>
    </BrowserRouter>
  </IonApp>
);

export default App;
