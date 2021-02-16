import {Colors, Popover} from '@blueprintjs/core';
import * as React from 'react';
import styled from 'styled-components';

import {SuggestionProvider} from 'src/ui/TokenizingField';
import {useSuggestionsForString} from 'src/ui/useSuggestionsForString';

interface Props {
  value: string;
  onChange: (value: string) => void;
  suggestionProviders: SuggestionProvider[];
}

type Action =
  | {type: 'show-popover'}
  | {type: 'hide-popover'}
  | {type: 'highlight'; highlight: number}
  | {type: 'change-query'}
  | {type: 'select-suggestion'};

type State = {
  shown: boolean;
  highlight: number;
};

const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'show-popover':
      return {...state, shown: true};
    case 'hide-popover':
      return {...state, shown: false};
    case 'highlight':
      return {...state, highlight: action.highlight};
    case 'change-query':
      return {...state, shown: true, highlight: 0};
    case 'select-suggestion':
      return {...state, highlight: 0};
    default:
      return state;
  }
};

const initialState: State = {
  shown: false,
  highlight: 0,
};

export const LogsFilterInput: React.FC<Props> = (props) => {
  const {value, onChange, suggestionProviders} = props;

  const [state, dispatch] = React.useReducer(reducer, initialState);
  const {shown, highlight} = state;

  const {empty, all} = suggestionProviders.reduce(
    (accum, provider) => {
      const {token} = provider;
      const values = provider.values();
      return {
        empty: [...accum.empty, `${token}:`],
        all: [...accum.all, `${token}:`, ...values.map((value) => `${token}:${value}`)],
      };
    },
    {empty: [], all: []},
  );

  const buildSuggestions = React.useCallback(
    (queryString: string): string[] =>
      queryString
        ? all.filter((value) => {
            const lower = value.toLowerCase();
            return lower !== queryString && lower.startsWith(queryString);
          })
        : [...empty],
    [all, empty],
  );

  const {suggestions, onSelectSuggestion} = useSuggestionsForString(buildSuggestions, value);

  const numResults = suggestions.length;
  const highlightedResult = suggestions[highlight] || null;

  const onInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch({type: 'change-query'});
      onChange(e.target.value);
    },
    [onChange],
  );

  const onSelect = React.useCallback(
    (suggestion: string) => {
      dispatch({type: 'select-suggestion'});
      onChange(onSelectSuggestion(suggestion));
    },
    [onChange, onSelectSuggestion],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    const {key} = e;
    if (key === 'Escape') {
      dispatch({type: 'hide-popover'});
      return;
    }

    if (!numResults) {
      return;
    }

    const lastResult = numResults - 1;

    switch (key) {
      case 'ArrowUp':
        e.preventDefault();
        dispatch({type: 'highlight', highlight: highlight === 0 ? lastResult : highlight - 1});
        break;
      case 'ArrowDown':
        e.preventDefault();
        dispatch({type: 'highlight', highlight: highlight === lastResult ? 0 : highlight + 1});
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedResult) {
          onSelect(highlightedResult);
        }
    }
  };

  return (
    <Popover
      minimal
      usePortal
      isOpen={shown && suggestions.length > 0}
      position="bottom-left"
      content={
        <Results>
          {suggestions.map((suggestion, ii) => (
            <Item
              key={suggestion}
              isHighlight={highlight === ii}
              onMouseDown={(e: React.MouseEvent<any>) => {
                e.preventDefault();
                onSelect(suggestion);
              }}
            >
              {suggestion}
            </Item>
          ))}
        </Results>
      }
    >
      <FilterInput
        type="text"
        placeholder="Filter…"
        spellCheck={false}
        autoCorrect="off"
        value={value}
        onChange={onInputChange}
        onFocus={() => dispatch({type: 'show-popover'})}
        onBlur={() => dispatch({type: 'hide-popover'})}
        onKeyDown={onKeyDown}
        style={{}}
      />
    </Popover>
  );
};

const FilterInput = styled.input`
  border: 1px solid ${Colors.GRAY5};
  border-radius: 3px;
  padding: 4px 6px;
  font-size: 12px;
  width: 300px;
`;

const Results = styled.ul`
  list-style: none;
  margin: 0;
  max-width: 800px;
  min-width: 300px;
  padding: 0;
`;

interface HighlightableTextProps {
  readonly isHighlight: boolean;
}

const Item = styled.li<HighlightableTextProps>`
  align-items: center;
  background-color: ${({isHighlight}) => (isHighlight ? Colors.BLUE3 : Colors.WHITE)};
  color: ${({isHighlight}) => (isHighlight ? Colors.WHITE : 'default')};
  cursor: pointer;
  display: flex;
  flex-direction: row;
  font-size: 12px;
  list-style: none;
  margin: 0;
  padding: 4px 8px;
  white-space: nowrap;
  text-overflow: ellipsis;

  &:hover {
    background-color: ${({isHighlight}) => (isHighlight ? Colors.BLUE3 : Colors.LIGHT_GRAY3)};
  }
`;