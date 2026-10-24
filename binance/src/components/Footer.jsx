import React from "react";
import { Box, Typography, Container } from "@mui/material";
import { styled, ThemeProvider, createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: '#ffcc00', // Matching yellow theme from navbar
    },
    background: {
      default: '#000428',
      paper: 'rgb(0, 0, 0)',
    },
    text: {
      primary: '#ffcc00',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

const FooterContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: "40px 0",
  color: theme.palette.primary.main,
  textAlign: "center",
}));

const FooterText = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  marginTop: "10px",
}));

const Footer = () => {
  return (
    <ThemeProvider theme={theme}>
      <FooterContainer>
        <Container>
          <FooterText variant="body2">
            &copy; {new Date().getFullYear()} Best application to secure your coins  All rights reserved.
          </FooterText>
        </Container>
      </FooterContainer>
    </ThemeProvider>
  );
};

export default Footer;
