import React, { Suspense, useState, useEffect, createContext } from 'react'
import { createBrowserHistory }                                from 'history'
import pathToRegexp                                            from 'path-to-regexp'

class SwitchEvent {
    isPropagationStopped = false
    stopPropagation = () => this.isPropagationStopped = true
}

class DummyEvent {
    isPropagationStopped = false
    stopPropagation = () => {}
}

// lets keep it compatible to react router
export const matchPath = ( pathname, options = {}) => {
    if (typeof options === "string") options = { path: options }

    const { path, exact = false, strict = false, sensitive = false } = options

    const keys   = []
    const regexp = pathToRegexp( path, keys, { end: exact, strict, sensitive } )
    const match  = regexp.exec( pathname )

    if (!match) return null

    const [url, ...values] = match
    const isExact = pathname === url

    if (exact && !isExact) return null

    return {
      path,
      isExact,
      url    : path === "/" && url === "" ? "/" : url,
      params : keys.reduce((memo, key, index) => {
        memo[key.name] = values[index]
        return memo
      }, {})
    }
}

const { Provider, Consumer } = createContext( new DummyEvent() )
const createHref             = () => document.location.href.replace( document.location.origin, '' )
const matchHref              = ( href, props = {} ) => matchPath( href, props )?.params
const routes                 = {}

export const history = createBrowserHistory()

export const useHistory = (props = {}) => {
    const href                  = createHref()
    const [ data, setData ]     = useState( href )
    const [ params, setParams ] = useState( matchHref( href, props ) )

    const unlisten = history.listen( () => {
        const href = createHref()
        if ( data !== href ) {
            setParams( matchHref( href, props ) )
            setData( href )
        }
    })

    useEffect( () => unlisten )

    return [ params, history ]
}

export function Switch({ children }) {
    useHistory({ path: '' })
    return <Provider value={ new SwitchEvent() }>{ children }</Provider>
}

export function Route({
    children,
    component,
    defaults  = {},
    exact     = false,
    fallback  = <div>loading...</div>,
    lazy,
    name,
    path,
    sensitive = false,
    strict    = false,
}) {

    const [ params ] = useHistory({ path, exact, strict, sensitive })

    if ( name && !routes[name] ) {
        routes[name] = {
            defaults,
            path,
            generator : pathToRegexp.compile(path)
        }
    }

    const checkConditions = event => {
        if ( !event.isPropagationStopped ) {
            if ( !params ) return null

            event.stopPropagation()

            const element = React.createElement(
                lazy ? React.lazy( lazy ) : component,
                lazy ? { params: { ...defaults, ...params } } : { ...component.props, params: { ...defaults, ...params } }
            )

            return (
               <Provider value={ new DummyEvent() }>
                    { lazy ? <Suspense fallback={ fallback }>{ element }</Suspense> : element }
                    { children }
                </Provider>
            )
        }
    }

    return React.createElement(Consumer, {}, checkConditions)
}

export function Redirect({
    exact     = false,
    path,
    sensitive = false,
    strict    = false,
    to,
}) {

    const [ matched, history ] = useHistory({ path, exact, strict, sensitive })
    const checkConditions      = event => {
        if (!event.isPropagationStopped && matched) {
            event.stopPropagation()
            history.replace( to )
        }
    }
    return <Consumer>{ checkConditions }</Consumer>
}

export function Link({
    activeClassName = 'active',
    children,
    className,
    exact           = false,
    onClick,
    params          = {},
    sensitive       = false,
    strict          = false,
    tag             = 'a',
    to,
    ...props
}) {

    const TagName = tag
    const path    = routes[to]
        ? routes[to].generator({ ...routes[to].defaults, ...params }, { pretty: true, noValidate: true })
        : to

    const [ matched, history ] = useHistory({ path, exact, strict, sensitive })
    const handleClick          = async (event) => {
        onClick && (await onClick( event ))
        if (event && !event.isDefaultPrevented()) {
            event.preventDefault()
            history.push( path )
        }
    }

    const additionalProps = tag === 'a'
        ? { href : path }
        : {}

    return (
        <TagName
            { ...additionalProps }
            className = { [ className, matched ? activeClassName : '' ].filter(Boolean).join(' ') }
            onClick   = { handleClick }
            { ...props }
        >
            { children }
        </TagName>
    )
}
