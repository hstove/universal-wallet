import React, { Component, Fragment } from 'react';
import { Header } from '../components';
import { WalletsStore, CoinsStore } from '../stores';

const getWalletValues = ({
  inputPrivateKey,
  inputPublicAddress,
  inputAlias,
  inputBalanceURL,
  inputBalanceProp,
  inputBalanceUnit,
  inputTransactionsURL,
  inputTransactionsProp,
  inputSymbol,
}) => {
  return {
    privateKey: inputPrivateKey.value,
    publicAddress: inputPublicAddress.value,
    alias: inputAlias.value,
    balanceURL: inputBalanceURL.value,
    balanceProp: inputBalanceProp.value,
    balanceUnit: inputBalanceUnit.value,
    transactionsURL: inputTransactionsURL.value,
    transactionsProp: inputTransactionsProp.value,
    symbol: inputSymbol.value,
  };
};

class Form extends Component {
  render() {
    const { btnLabel, coins, onCancel, defaultValues = {} } = this.props;
    const {
      privateKey = '',
      publicAddress = '',
      alias = '',
      transactionsURL = '',
      transactionsProp = '',
      balanceURL = '',
      balanceProp = '',
      balanceUnit = '',
      symbol = '',
    } = defaultValues;
    return (
      <form
        ref={f => (this.form = f)}
        onSubmit={this.onSubmit}
        key={Date.now()}
      >
        <input type="submit" value={btnLabel} />
        {onCancel && <button onClick={onCancel}>Cancel</button>}
        <input
          placeholder="Private Key (unencrypted)"
          type="text"
          name="inputPrivateKey"
          required
          defaultValue={privateKey}
        />
        <input
          placeholder="Public Address"
          type="text"
          name="inputPublicAddress"
          required
          defaultValue={publicAddress}
        />
        <input
          placeholder="Alias"
          type="text"
          name="inputAlias"
          required
          defaultValue={alias}
        />
        <input
          placeholder="Balance URL"
          type="text"
          name="inputBalanceURL"
          defaultValue={balanceURL}
        />
        <input
          placeholder="Balance Prop"
          type="text"
          name="inputBalanceProp"
          defaultValue={balanceProp}
        />
        <input
          placeholder="Balance Unit"
          type="text"
          name="inputBalanceUnit"
          defaultValue={balanceUnit}
        />
        <input
          placeholder="Transactions URL"
          type="text"
          name="inputTransactionsURL"
          defaultValue={transactionsURL}
        />
        <input
          placeholder="Transactions Prop"
          type="text"
          name="inputTransactionsProp"
          defaultValue={transactionsProp}
        />
        <select name="inputSymbol" required defaultValue={symbol}>
          <option key="wallets-coins-label" disabled value="" hidden>
            Coin
          </option>
          {coins.map(({ name, symbol }, index) => {
            return (
              <option key={`wallets-coins-${index}`} value={symbol}>
                {symbol} - {name}
              </option>
            );
          })}
        </select>
      </form>
    );
  }

  onSubmit = e => {
    e.preventDefault();
    this.props.onSubmit(this.form);
  };
}

class Wallets extends Component {
  state = {
    editWallet: null,
  };

  render() {
    const {
      coins,
      coinsError,
      coinsLoading,
      wallets,
      walletsError,
      walletsLoading,
    } = this.props;
    const { editWallet } = this.state;
    const sortedList = wallets.sort((a, b) => b.lastModified - a.lastModified);

    return (
      <Fragment>
        {coinsError}
        {walletsError}
        {editWallet ? (
          <Form
            defaultValues={{ ...wallets.find(({ id }) => id === editWallet) }}
            coins={coins}
            onCancel={this.onEditCancel}
            onSubmit={this.onEdit}
            btnLabel={'Save'}
          />
        ) : (
          <Form coins={coins} onSubmit={this.onNew} btnLabel={'Add new'} />
        )}
        {coinsLoading || walletsLoading ? (
          <div>loading</div>
        ) : (
          <ul>
            {sortedList.map(
              ({ id, createdAt, lastModified, alias, symbol }, index) => {
                const { name, imageSmall } = coins.find(
                  item => item.symbol === symbol,
                );
                const created = new Date(createdAt);
                const modified = new Date(lastModified);
                return (
                  <li key={`wallets-${id}`}>
                    <button onClick={() => this.setState({ editWallet: id })}>
                      Edit
                    </button>
                    <img alt={`${name}`} src={imageSmall} />
                    <div>{alias}</div>
                    <div>
                      {name} ({symbol})
                    </div>
                    <div>created {created.toDateString()}</div>
                    <div>last modified {modified.toDateString()}</div>
                    <button onClick={() => this.onDelete(id)}>Delete</button>
                  </li>
                );
              },
            )}
          </ul>
        )}
      </Fragment>
    );
  }

  onDelete = async id => {
    await this.props.walletsDelete(id)
    this.props.walletsGet();
  };

  onEdit = async form => {
    await this.props.walletsPut(this.state.editWallet, getWalletValues(form))
    form.reset();
    this.props.walletsGet();
  };

  onEditCancel = e => {
    e.preventDefault();
    this.setState({ editWallet: null });
  };

  onNew = async form => {
    await this.props.walletsPost(getWalletValues(form))
    form.reset();
    this.props.walletsGet();
  };
}

export default () => (
  <Fragment>
    <Header />
    <CoinsStore>
      <WalletsStore>
        <Wallets />
      </WalletsStore>
    </CoinsStore>
  </Fragment>
);