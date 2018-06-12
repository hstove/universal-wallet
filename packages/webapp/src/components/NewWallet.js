import React, { Component, Fragment } from 'react';
import { Spinner, CoinsView, Form } from '../components';
import { SectionHeader, SectionTitle, Button, Leaders, Dots } from '../theme';
import {
  generate,
  generateAvailable,
  fromWif,
  fromWifAvailable,
  defaults,
} from '../utils/wallets';
import styled from 'styled-components';

const LeadersFirst = Leaders.extend`
  margin-top: 0;
`;

const LeadersNewWallet = Leaders.extend`
  margin-top: 2em;
`;

const DivOptions = styled.div`
  margin-top: 1em;
  font-size: 12px;
  margin-left: 1em;
`;

const LeadersOptions = LeadersNewWallet.extend`
  margin-top: 1em;
`;

const DivOptionTitle = styled.div`
  margin-top: 2em;
`;

const DivNote = DivOptions.extend`
  margin-top: 2em;
  font-size: 11px;
`;

class NewWallet extends Component {
  state = { alias: null };

  componentDidUpdate(prevProps) {
    const { qrData } = this.props;
    if (!prevProps.qrData && qrData) {
      this.onImportWIF(qrData);
    }
  }

  render() {
    const { coin, coins, coinsLoading } = this.props;
    const { alias } = this.state;

    return (
      <Fragment>
        <SectionHeader>
          <SectionTitle>New Wallet</SectionTitle>
        </SectionHeader>
        {coinsLoading && <Spinner />}
        {!coinsLoading && (
          <Fragment>
            <LeadersFirst>
              1. Pick a coin:
              <Dots />
              <CoinsView coin={coin} coins={coins} onChange={this.pick} />
            </LeadersFirst>

            <LeadersNewWallet>
              2. Set an alias:
              <Dots />
              <input
                disabled={!coin}
                type="text"
                placeholder="Alias"
                onInput={this.aliasInput}
              />
            </LeadersNewWallet>

            <LeadersNewWallet>
              3. Pick one method to create the wallet:
            </LeadersNewWallet>
            <DivOptions>
              <LeadersOptions>
                a. Import with WIF QR code
                <Dots />
                <Button
                  disabled={
                    !alias ||
                    !fromWifAvailable().find(
                      o => o.symbol === coin.symbol.toLowerCase(),
                    )
                  }
                  onClick={this.onScan}
                >
                  Scan
                </Button>
              </LeadersOptions>
              <DivNote>
                * Only available for:{' '}
                {fromWifAvailable()
                  .map(o => o.name)
                  .join(', ')}
              </DivNote>

              <LeadersOptions>
                <DivOptionTitle>b. Generate wallet</DivOptionTitle>
                <Dots />
                <Button
                  disabled={
                    !alias ||
                    !generateAvailable().find(
                      o => o.symbol === coin.symbol.toLowerCase(),
                    )
                  }
                  onClick={this.onGenerate}
                >
                  Generate
                </Button>
              </LeadersOptions>
              <DivNote>
                * Only available for:{' '}
                {generateAvailable()
                  .map(o => o.name)
                  .join(', ')}
              </DivNote>

              <Form onSubmit={this.onBlank}>
                <Leaders>
                  <div>c. Enter details manually</div>
                  <Dots />
                  <Button type="submit" disabled={!alias}>
                    Save
                  </Button>
                </Leaders>
                <DivOptions>
                  <LeadersNewWallet>
                    <div>Private Key (unencrypted)</div>
                    <Dots />
                    <input
                      required
                      name="inputPrivateKey"
                      type="password"
                      placeholder="Private Key"
                    />
                  </LeadersNewWallet>
                  <LeadersNewWallet>
                    <div>Public Address</div>
                    <Dots />
                    <input
                      required
                      name="inputPublicAddress"
                      type="text"
                      placeholder="Public Address"
                    />
                  </LeadersNewWallet>
                </DivOptions>
              </Form>
            </DivOptions>
          </Fragment>
        )}
      </Fragment>
    );
  }

  aliasInput = ({ currentTarget: { value: alias } }) => {
    this.setState({ alias });
  };

  onBlank = form => {
    const { alias } = this.state;
    const { coin: { symbol } } = this.props;
    const { inputPublicAddress, inputPrivateKey } = form.elements;
    const privateKey = inputPrivateKey.value;
    const publicAddress = inputPublicAddress.value;
    const data = defaults(symbol);
    this.post({ ...data, alias, privateKey, publicAddress });
  };

  onGenerate = () => {
    const { alias } = this.state;
    const { coin: { symbol } } = this.props;
    if (
      generateAvailable().find(
        w => w.symbol.toLowerCase() === symbol.toLowerCase(),
      )
    ) {
      const data = generate(symbol.toLowerCase())();
      this.post({ ...data, alias });
    }
  };

  onImportWIF = wif => {
    const { alias } = this.state;
    const { coin: { symbol } } = this.props;
    const data = fromWif(symbol)(wif);
    this.post({ ...data, alias });
  };

  onScan = () => {
    const { coin: { symbol }, qrScan } = this.props;
    if (fromWifAvailable().find(i => i.symbol === symbol.toLowerCase())) {
      qrScan();
    }
  };

  pick = symbol => {
    this.props.coinPick(symbol);
  };

  post = async obj => {
    const { history, walletsPost } = this.props;
    const { id } = await walletsPost(obj);
    history.push(`/${id}`);
  };
}

export default NewWallet;
