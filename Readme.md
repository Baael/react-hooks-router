# react-hooks-router

Rather an idea than production solution, but it is working, and it is working quite nicely.

Use example (not logical):

```jsx
    <Route path="/post/:id*" component={ HeaderForExample } />
    <Switch>
        <Redirect path="/somewhere" to="/404"/>
        <Route
            name      = "named.route"
            defaults  = {{ id: 1, author: 'baael' }}
            path      = "/post/:id/:author?" 
            component = { PostLayout } 
        >
            <Route
                path      = "/post/:id/:author" 
                component = { AuthorInfo } 
            />        
            <Route
                path      = "/post/:id/:author?" 
                component = { PostBody } 
            />        
        </Route>
        <Route
            path     = "/lazy/:id" 
            fallback = { <div>We are waiting here!!!</div> }
            lazy     = { () => import('components/LazyOne') }
        />
        <Route
            path = "/404" 
            lazy = { () => import('components/404') }
        />

        <Link
          to     = "named.route"
          params = {{ id: 100, author: 'tester' }}
        >
          Link to named route
        </Link>
        <Link to="/post/2">Post 2</Link>
        <Link to="/post/3">Post 4</Link>
        <Link activeClass="make-me-blink" to="/post/4">Post 5</Link>
        <Link to="/somewhere">It redirects</Link>
    </Switch>
```

