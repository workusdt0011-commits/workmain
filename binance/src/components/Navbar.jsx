import * as React from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Typography,
  Menu,
  MenuItem,
  Container,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { styled, ThemeProvider, createTheme } from "@mui/material/styles";
import bnblogo from "../avtar/logo.png";

const NavLink = styled(Typography)(() => ({
  color: "#18191bff",                   // BscScan nav link color
  cursor: "pointer",
  fontSize: "13px",
  padding: "6px 10px",
  fontWeight: 500,
  borderRadius: "4px",
  textDecoration: "none",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.08)",  // subtle hover
    color: "#FFFFFF",
    transition: "background-color 0.2s, color 0.2s",
  },
}));

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      paper: "#e3e7f1ff",    // approximate BscScan navbar bg
      default: "#eef0f5ff",
    },
    text: {
      primary: "#EDEEF2",
    },
    primary: {
      main: "#FFFFFF",
    },
  },
  typography: {
    fontFamily: "Inter, Roboto, Arial, sans-serif",
  },
});

export default function BscScanNavbar() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const openMenu = (e) => setAnchorEl(e.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const pages = [
    { name: "Home", url: "https://bscscan.com" },
    { name: "Blockchain", url: "https://bscscan.com/txs" },
    { name: "Tokens", url: "https://bscscan.com/tokens" },
    { name: "NFTs", url: "https://bscscan.com/nft-top-contracts" },
    { name: "Validators", url: "https://bscscan.com/validators" },
    { name: "Charts & Stats", url: "https://bscscan.com/charts" },
    { name: "Developers", url: "https://bscscan.com/apis" },
  ];

  return (
    <ThemeProvider theme={theme}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderBottom: "1px solid rgba(255,255,255,0.1)",  // subtle border
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ justifyContent: "space-between", minHeight: 56 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <img src={bnblogo} alt="Logo" style={{ height: 36 }} />
            </Box>

            <IconButton
              sx={{ display: { xs: "block", md: "none" }, color: "#EDEEF2" }}
              onClick={openMenu}
            >
              <MenuIcon />
            </IconButton>

            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
              {pages.map((p) => (
                <NavLink
                  key={p.name}
                  component="a"
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {p.name}
                </NavLink>
              ))}
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={closeMenu}
              PaperProps={{
                sx: {
                  backgroundColor: "#0B0D13",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#EDEEF2",
                },
              }}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              {pages.map((p) => (
                <MenuItem key={p.name} onClick={closeMenu}>
                  <Typography
                    component="a"
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      textDecoration: "none",
                      color: "#EDEEF2",
                      fontSize: "13px",
                      width: "100%",
                      "&:hover": { color: "#FFFFFF" },
                    }}
                  >
                    {p.name}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>

          </Toolbar>
        </Container>
      </AppBar>
    </ThemeProvider>
  );
}
