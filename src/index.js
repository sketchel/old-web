import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { ThemeProvider, theme, CSSReset } from "@chakra-ui/core";
import { BrowserRouter as Router, Route } from 'react-router-dom'
import DrawApp from './DrawingApp';

const AppRouter = () => (
    <Router>
      <Route exact path="/" component={App} />
      <Route exact path="/draw" component={DrawApp} />
    </Router>
)

export const Theme = () => {
    return ( 
        <ThemeProvider theme={theme}>
            <CSSReset />
            <AppRouter />
        </ThemeProvider>
    )
}


ReactDOM.render(<Theme />, document.getElementById('app'));
